# Reel Generation Feature — Design Spec
**Date:** 2026-05-08  
**Status:** Approved  
**Project:** AI-Powered Marketplace (`ai-market-asst-1`)

---

## Overview

Sellers can generate a 15–30 second portrait video reel (9:16, 1080p) for any product by clicking "Generate Reel" in their dashboard. The reel is built from their product images + description using an AI pipeline: Gemini 1.5 Flash for storytelling script, Veo 3.1 Fast for image-to-video clips with native ambient audio, Google Cloud TTS for voiceover narration, and FFmpeg to stitch and mix everything. Generation runs in the background; the seller is notified via Telegram when it's ready. The finished reel appears on the product page and in the `/reels` discovery feed.

This is designed as a manual, premium-tier feature — sellers trigger it on demand, one reel per product at a time.

---

## Full Pipeline Architecture

```
Seller clicks "Generate Reel" on dashboard
        ↓
POST /api/v1/storytelling/generate
  → Validate images (pre-processing)
  → Create Firestore job doc { status: "pending" }
  → Return { job_id } immediately
  → Spawn background task: run_reel_pipeline(job_id)
        ↓
─────────────── Background Worker ───────────────
│                                               │
│  Stage 1: PRE-PROCESSING                      │
│    For each image URL:                        │
│    - Download + validate (corrupt → skip)     │
│    - Reject if < 512px on any side            │
│    - Normalize to 9:16 (pad/crop)             │
│    - Convert to JPEG if needed                │
│    - Deduplicate by image hash                │
│    - Dead URL → replace with placeholder      │
│    If 0 valid images → fail early             │
│    Cap at 4 images (use first 4 if more)      │
│           ↓                                   │
│  Stage 2: SCRIPTING (Gemini 1.5 Flash)        │
│    description + image_count → StoryCreative  │
│    { hook, scene_captions[N], cta, tagline,   │
│      music_mood, visual_keywords }            │
│           ↓                                   │
│  Stage 3: VOICEOVER (Google Cloud TTS)        │
│    hook + scene_captions + cta → .mp3         │
│    Measure tts_duration via ffprobe           │
│    clip_duration = clamp(                     │
│      tts_duration / image_count, 5, 10)       │
│           ↓                                   │
│  Stage 4: VIDEO CLIPS                         │
│    Primary: Veo 3.1 Fast (per image)          │
│      image + scene_caption → 5-8s clip        │
│      with native ambient audio                │
│      Poll LRO every 15s, timeout 10min        │
│      If any clip fails → VeoFallbackRequired  │
│           ↓ (on VeoFallbackRequired)          │
│    Fallback: Enhanced FFmpeg (all clips)      │
│      zoom-pan + xfade transitions             │
│      text overlays (hook / caption / cta)     │
│      single-image: 3 virtual passes (20s)     │
│           ↓                                   │
│  Stage 5: STITCH + MIX (FFmpeg)               │
│    Veo path: clips (ambient@20%) + TTS@100%   │
│    FFmpeg path: clips (silent) + TTS@100%     │
│    → final.mp4 (1080×1920, portrait)          │
│           ↓                                   │
│  Stage 6: UPLOAD (GCS)                        │
│    Upload to gs://bucket/reels/{job_id}.mp4   │
│    Set ACL public-read                        │
│    Verify URL returns HTTP 200                │
│           ↓                                   │
│  Stage 7: PERSIST + NOTIFY                    │
│    product.reelUrl = video_url                │
│    product.reelMode = "veo" | "ffmpeg"        │
│    job.status = "complete"                    │
│    Telegram: "Your reel for [product] is      │
│    ready! Tap to preview."                    │
─────────────────────────────────────────────────
```

---

## Image Handling Edge Cases

| Scenario | Behaviour |
|---|---|
| 1 valid image | Veo generates 2 variations (push-in + pan prompt variants); FFmpeg fallback generates 3 virtual passes |
| 2–3 images | Standard flow, clip_duration computed from TTS |
| 4 images | Standard flow — sweet spot for 25–30s reel |
| 5+ images | Cap at first 4; extras ignored for reel (still shown in product listing) |
| Duplicate images | Deduplicated by MD5 hash before pipeline starts |
| Corrupt/unreadable image | Skipped with warning; remaining images continue |
| Dead URL | Replaced with placeholder frame; logged |
| Image < 512px | Rejected (not skipped); counts as 0 valid images |
| 0 valid images | Job fails immediately, clear error message to seller |
| Mixed aspect ratios | All normalized to 9:16 via FFmpeg pad/crop before Veo |

---

## Job Document Schema (Firestore: `reels/{job_id}`)

```json
{
  "jobId": "reel_abc123",
  "productId": "prod_xyz",
  "sellerId": "uid_...",
  "status": "pending | scripting | voiceover | video | stitching | uploading | complete | failed",
  "mode": "veo | ffmpeg",
  "imageUrls": ["https://..."],
  "validImageCount": 2,
  "clipDuration": 8,
  "videoUrl": null,
  "error": null,
  "createdAt": "2026-05-08T10:00:00Z",
  "expiresAt": "2026-05-08T10:15:00Z",
  "completedAt": null
}
```

**Constraints:**
- One active job per product at a time. If a job already exists for a product, `POST /generate` returns the existing `job_id`.
- Jobs that remain non-terminal after 15 minutes are marked `failed` by cleanup cron.
- If Veo fails on any clip, the entire job switches to FFmpeg for all remaining clips (no mixed-mode reels).

---

## Veo 3.1 Fast Integration

**GCP Setup (one-time manual steps):**
```bash
# 1. Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com \
  --project=ai-market-asst-1

# 2. Create service account
gcloud iam service-accounts create reel-generator \
  --project=ai-market-asst-1

gcloud projects add-iam-policy-binding ai-market-asst-1 \
  --member="serviceAccount:reel-generator@ai-market-asst-1.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding ai-market-asst-1 \
  --member="serviceAccount:reel-generator@ai-market-asst-1.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# 3. Download key
gcloud iam service-accounts keys create gcp_service_account.json \
  --iam-account=reel-generator@ai-market-asst-1.iam.gserviceaccount.com

# 4. Install SDK
pip install --upgrade google-genai
```

**New `.env` keys:**
```
GOOGLE_APPLICATION_CREDENTIALS=./gcp_service_account.json
GOOGLE_CLOUD_PROJECT=ai-market-asst-1
GOOGLE_CLOUD_LOCATION=us-central1
GCS_BUCKET_NAME=ai-market-asst-1-reels
VEO_ENABLED=true
VEO_MODEL_ID=veo-3.1-fast-generate-001
```

**Image-to-video call:**
```python
from google import genai
from google.genai import types

client = genai.Client(
    vertexai=True,
    project=settings.GOOGLE_CLOUD_PROJECT,
    location=settings.GOOGLE_CLOUD_LOCATION
)

operation = client.models.generate_videos(
    model=settings.VEO_MODEL_ID,
    prompt=scene_caption,
    image=types.Image(
        image_bytes=jpeg_bytes,
        mime_type="image/jpeg"
    ),
    config=types.GenerateVideosConfig(
        aspect_ratio="9:16",
        duration_seconds=clip_duration,   # 5–10, computed from TTS
        resolution="1080p",
        number_of_videos=1,
    )
)

while not operation.done:
    await asyncio.sleep(15)
    operation = client.operations.get(operation.name)

video_gcs_uri = operation.result.generated_videos[0].video.uri
```

**Fallback trigger:**
```python
async def generate_clip(image_bytes, caption, duration):
    if not settings.VEO_ENABLED:
        return ffmpeg_generate_clip(image_bytes, caption, duration)
    try:
        return await veo_generate_clip(image_bytes, caption, duration)
    except (QuotaExceeded, VeoUnavailable, TimeoutError, Exception):
        raise VeoFallbackRequired()
# Caller catches VeoFallbackRequired and re-runs all clips via FFmpeg
```

**Cost estimate:**
```
Veo 3.1 Fast: ~$0.35/second of generated video
4 clips × 8s = 32s → ~$11 per reel
$300 GCP credits → ~27 reels before paying
Recommendation: use FFmpeg mode during development,
switch VEO_ENABLED=true for demos and production
```

---

## Enhanced FFmpeg Fallback

**Text overlay (re-enabled with font fallback):**
```python
def _build_drawtext(text, y_pos, fontsize):
    font = _resolve_font()   # system fonts → bundled DejaVu fallback
    if not font:
        return ""
    safe = text.replace("'", "\\'").replace(":", "\\:")
    return (
        f"drawtext=fontfile='{font}':text='{safe}':"
        f"fontsize={fontsize}:fontcolor=white:x=(w-tw)/2:y={y_pos}:"
        f"shadowx=2:shadowy=2:shadowcolor=black@0.6:"
        f"box=1:boxcolor=black@0.3:boxborderw=8"
    )
```

**Portrait text layout (per clip):**
```
┌─────────────────┐
│  hook text      │  ← top, fades in at 0.5s (first clip only)
│                 │
│  [image]        │
│                 │
│  scene caption  │  ← bottom third, always visible
│  [CTA badge]    │  ← last clip only
└─────────────────┘
```

**Single-image path (3 virtual passes):**
```
Pass 1 (0–7s):  slow zoom-in  + hook overlay
Pass 2 (7–14s): slow pan-left + scene caption
Pass 3 (14–20s): slow zoom-out + CTA text
→ stitched → 20s reel that feels like 3 scenes
```

**Transition selection by style_preset:**
```
museum_cinematic → fade, fadeblack
artisan_story    → circlecrop, distance
editorial_premium → wipeleft, wiperight
modern_minimal   → fade
```

**Audio mixing (FFmpeg fallback — silent clips):**
```
TTS voiceover only at 100% volume
```

**Audio mixing (Veo path — clips have native audio):**
```
FFmpeg amix:
  input 0: Veo clip audio  @ 0.2 volume (ambient)
  input 1: TTS voiceover   @ 1.0 volume (narration)
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/storytelling/generate` | Required | Start reel generation job |
| `GET` | `/api/v1/storytelling/status/{job_id}` | Required | Poll job status |
| `DELETE` | `/api/v1/storytelling/jobs/{job_id}` | Required | Cancel pending job |
| `GET` | `/api/v1/storytelling/styles` | None | List style presets (existing) |

**POST `/generate` request:**
```json
{
  "productId": "prod_xyz",
  "imageUrls": ["https://...", "https://..."],
  "description": "Handmade terracotta pot...",
  "productName": "Rajasthani Terracotta Vase",
  "tone": "premium",
  "audience": "home decor enthusiasts",
  "stylePreset": "artisan_story"
}
```

**POST `/generate` response:**
```json
{ "jobId": "reel_abc123", "status": "pending" }
```

**GET `/status/{job_id}` response:**
```json
{
  "jobId": "reel_abc123",
  "status": "video",
  "mode": "veo",
  "videoUrl": null,
  "error": null
}
```

---

## Frontend Changes

### Dashboard (seller)
- "Generate Reel" button on each product card
- Disabled + shows existing `job_id` if generation is already active
- While active: progress indicator showing current stage (e.g., "Generating clips... 2/4")
- On complete: "▶ Preview Reel" + "↺ Regenerate" buttons appear
- On failure: error message + "Try Again" button

### Product page (buyer)
- If `product.reelUrl` exists: embedded portrait video player (autoplay muted, loop)
- Label: "Watch the story behind this piece"
- Falls back gracefully to image gallery if no reel

### `/reels` page
- Queries all products where `reelUrl != null`
- Vertical scroll feed (portrait, full-screen per reel)
- Overlay: product name, artisan, price, "Add to Cart"

### New `lib/api.ts` functions
```typescript
generateReel(productId, imageUrls, description, options)
  → POST /storytelling/generate → { jobId }

getReelStatus(jobId)
  → GET /storytelling/status/{jobId} → { status, stage, videoUrl, error }

cancelReel(jobId)
  → DELETE /storytelling/jobs/{jobId}
```

---

## Cleanup Cron

Runs every 10 minutes via the bot's built-in `JobQueue` (registered in `bot/notifications/dispatcher.py` → `register_notification_jobs(jq)`, already called from `bot/main.py`):
- Finds jobs where `status NOT IN (complete, failed)` AND `createdAt < now - 15min`
- Marks them `failed`, sets `error: "Job timed out after 15 minutes"`
- Sends Telegram notification to seller

---

## Integration Points With Existing Code

| File | What changes |
|---|---|
| `backend/app/bot/sell/reel.py` | Upgrade `generate_reel_for_product` to use the new Firestore job-based pipeline instead of calling `generate_story_video` directly (blocking). Keep the Telegram send logic. |
| `backend/app/ml/pipelines/video_generator.py` | Replace FFmpeg-only `generate_story_video` with the new Veo-first orchestrator. Keep existing FFmpeg path as the fallback. |
| `backend/app/services/storytelling/video_engine.py` | Re-enable `_build_drawtext()` with font fallback. Add single-image 3-pass path. Add transition selection by style preset. |
| `backend/app/api/v1/endpoints/storytelling.py` | Add `POST /generate` (new job-based), `GET /status/{job_id}`, `DELETE /jobs/{job_id}`. Existing `/generate-video` and `/generate-copy` stay untouched. |
| `backend/app/services/storytelling/audio_engine.py` | Add `get_audio_duration(path) -> float` helper (ffprobe). No other changes. |
| `backend/app/bot/notifications/dispatcher.py` | Register cleanup cron job in `register_notification_jobs`. |
| `frontend/lib/api.ts` | Add `generateReel`, `getReelStatus`, `cancelReel`. |
| `frontend/app/dashboard/page.tsx` | Add Generate Reel button + polling UI per product card. |
| `frontend/app/product/[id]/page.tsx` | Show reel player if `product.reelUrl` exists. |
| `frontend/app/reels/page.tsx` | Wire to real data (products where `reelUrl != null`). |

---

## Non-Goals (explicitly out of scope)
- Landscape/square format reels
- Background music (only TTS voiceover + Veo native ambient)
- Auto-generation on product publish (manual only)
- Batch generation (one product at a time)
- Video editing after generation
- A/B style variants in one job
