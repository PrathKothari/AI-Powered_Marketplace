# Live Streaming & User Bio — Design Spec

**Date:** 2026-04-10
**Status:** Approved

---

## 1. Overview

Two features for KalaSetu:

1. **Live Streaming** — Users (sellers) broadcast themselves creating art via WebRTC. Viewers watch via HLS, chat in real-time, and buy the featured product. Recordings are saved to Firebase Storage for later conversion to reels.
2. **User Bio** — Any user can add a bio to their profile. The bio shows on product pages, live streams, and their profile. Prompted (not required) when listing a product or going live.

There is no role distinction — any user can browse, buy, sell, and go live.

---

## 2. Live Streaming Architecture

### 2.1 High-Level Data Flow

```
Seller Browser (WebRTC via getUserMedia)
  → FastAPI WebSocket (signaling: SDP offer/answer, ICE candidates)
  → aiortc (server-side WebRTC peer, receives media tracks)
  → FFmpeg subprocess (transcodes to HLS: .m3u8 playlist + .ts segments)
  → Temp directory (served via FastAPI static route during stream)
  → Viewers load HLS playlist via hls.js video player

On stream end:
  → FFmpeg concatenates .ts segments into .mp4
  → .mp4 uploaded to Firebase Storage
  → URL saved to Firestore live_sessions document
```

### 2.2 Backend Dependencies

- `aiortc` — Python WebRTC implementation (receives artisan's stream server-side)
- `av` (PyAV) — Media frame handling (dependency of aiortc)
- `FFmpeg` — System dependency for HLS transcoding and recording concatenation

### 2.3 Frontend Dependencies

- `hls.js` — HLS playback in browsers that don't natively support it

---

## 3. Data Model

### 3.1 Firestore: `live_sessions` (new collection)

```
{
  sessionId: string (UUID),
  userId: string (Firebase UID),
  userName: string,
  title: string,
  description: string,
  productId: string,           // single featured product
  status: "live" | "ended",
  viewerCount: int,
  hlsUrl: string,              // HLS playlist URL (during stream: local; after: Firebase Storage)
  recordingUrl: string | null, // Firebase Storage URL after stream ends
  thumbnailUrl: string | null,
  startedAt: ISO datetime,
  endedAt: ISO datetime | null
}
```

### 3.2 Firestore: `live_chat_messages` (new collection)

```
{
  messageId: string (UUID),
  sessionId: string,
  userId: string,
  userName: string,
  message: string,
  timestamp: ISO datetime
}
```

### 3.3 Firestore: `users` (existing collection — add fields)

Add to existing user documents:

```
{
  ...existing fields,
  bio: string | null,
  craftType: string | null,
  region: string | null,
  experienceYears: int | null,
  languages: [string] | null
}
```

---

## 4. Backend API

### 4.1 Live Session REST Endpoints (under `/api/v1/live`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/live/sessions` | Create a new live session (title, description, productId) | Yes |
| GET | `/live/sessions` | List active + recent ended sessions | No |
| GET | `/live/sessions/{id}` | Get session details (hlsUrl, product, chat history) | No |
| PATCH | `/live/sessions/{id}/end` | End session, trigger recording upload | Yes (owner) |

### 4.2 WebSocket Endpoints

| Path | Purpose |
|------|---------|
| `/ws/live/{session_id}/stream` | WebRTC signaling — artisan sends SDP offer, receives answer, exchanges ICE candidates. Server creates aiortc peer connection and starts HLS pipeline. |
| `/ws/live/{session_id}/chat` | Real-time chat — bidirectional. Messages broadcast to all connected clients and persisted to Firestore `live_chat_messages`. |

### 4.3 User Profile Endpoints (extend existing `/api/v1/users`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| PATCH | `/users/profile` | Update user profile including bio, craftType, region, experienceYears, languages | Yes |
| GET | `/users/profile/{userId}` | Get public user profile (name, bio, craftType, region) | No |

### 4.4 HLS Segment Serving

- During a live stream, HLS `.m3u8` and `.ts` files are served from a temp directory via a FastAPI static mount at `/hls/{session_id}/`
- After stream ends, `hlsUrl` in the session document points to the Firebase Storage recording URL

---

## 5. Backend Implementation Details

### 5.1 Stream Start Flow

1. Seller creates session: `POST /live/sessions` with `{title, description, productId}` → returns `sessionId`
2. Seller's browser connects to `/ws/live/{session_id}/stream`
3. Browser captures camera+mic via `getUserMedia()`, creates `RTCPeerConnection`
4. Browser sends SDP offer over WebSocket
5. Backend creates `aiortc.RTCPeerConnection`, sets remote description, creates answer
6. Backend sends SDP answer back over WebSocket
7. ICE candidates exchanged bidirectionally over the same WebSocket
8. Once media flows, aiortc receives audio/video tracks
9. Backend pipes media frames to FFmpeg subprocess:
   - Command: `ffmpeg -f rawvideo ... -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments {temp_dir}/{session_id}/stream.m3u8`
10. Session status set to `"live"`, `hlsUrl` set to `/hls/{session_id}/stream.m3u8`

### 5.2 Stream End Flow

1. Seller hits "End Stream" → `PATCH /live/sessions/{id}/end`
2. Backend closes the aiortc peer connection
3. FFmpeg process receives EOF, finalizes last segment
4. All `.ts` segments concatenated to `.mp4` via FFmpeg
5. `.mp4` uploaded to Firebase Storage
6. Session document updated: `status: "ended"`, `recordingUrl` and `hlsUrl` set to Firebase URL, `endedAt` set

### 5.3 Chat WebSocket

- On connect: add client to a session-specific set of connections
- On message: broadcast to all connected clients, persist to `live_chat_messages` collection
- On disconnect: remove from set, decrement viewer count
- Viewer count tracked by number of active chat WebSocket connections (separate from the stream WebSocket)

---

## 6. Frontend Pages

### 6.1 `/live` — Browse Live Sessions

- Grid of `LiveSessionCard` components
- Each card: thumbnail (or placeholder), title, seller name, "LIVE" badge (red) or "Replay" tag, viewer count
- Active sessions first, then recent ended sessions
- Navbar: add "Live" link between "Discover" and "Origin"

### 6.2 `/live/[id]` — Watch Stream

Layout:
```
┌─────────────────────────────┬──────────────┐
│                             │  Live Chat   │
│     HLS Video Player        │              │
│     (LivePlayer)            │  messages... │
│                             │              │
│                             │  [Type here] │
├─────────────────────────────┴──────────────┤
│  ┌──────────┐                              │
│  │ Product  │  Product Title               │
│  │  Image   │  ₹2,500                      │
│  └──────────┘  [Buy Now →]                 │
└────────────────────────────────────────────┘
```

- **LivePlayer**: Uses `hls.js` to play the `.m3u8` URL from session data. Works for both live and replay.
- **LiveChat**: WebSocket connection to `/ws/live/{session_id}/chat`. Shows messages, input box. Disabled/hidden for ended sessions (show chat history instead).
- **Featured Product**: Fetched via existing catalog API using `productId` from session. Shows image, title, price, "Buy Now" link to `/product/[id]`.
- **Mobile**: Chat stacks below video, product below chat.
- **Seller info**: Name + bio displayed near the video player.

### 6.3 `/live/start` — Go Live Setup

**Step 1 — Select Product:**
- "Which product are you showcasing?"
- Two options:
  - **Pick existing** — searchable list of the user's own products
  - **List a new product** — redirects to `/sell` with a `?returnTo=live` param. After listing, redirects back to `/live/start` with the new `productId` pre-selected.

**Step 2 — Session Details:**
- Title (text input)
- Description (textarea)
- Camera + mic preview (live `<video>` element from `getUserMedia`)

**Step 3 — Go Live:**
- "Go Live" button → creates session via API, opens signaling WebSocket, starts broadcasting

**Bio prompt:** If user has no bio set, show a dismissible banner: "Add a bio to let viewers know about you" with a link to `/profile`.

### 6.4 `/profile` — Updated Profile Page

Add editable fields:
- Bio (textarea)
- Craft Type (dropdown matching existing categories)
- Region (text input)
- Experience (number input, years)
- Languages (multi-select or comma-separated input)

### 6.5 `/sell` — Updated Sell Page

- If user has no bio, show dismissible banner: "Complete your profile to build trust with buyers" linking to `/profile`
- Support `?returnTo=live` query param: after successful product listing, redirect to `/live/start?productId={newId}` instead of the default confirmation

### 6.6 Product Page (`/product/[id]`) — Updated

Add an "About the Seller" section:
- Fetch user profile via `GET /users/profile/{artisanId}`
- Show name, bio, craft type, region
- Only shown if bio exists

---

## 7. Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| `LiveSessionCard` | `components/live/LiveSessionCard.tsx` | Card for the `/live` grid |
| `LivePlayer` | `components/live/LivePlayer.tsx` | HLS video player using hls.js |
| `LiveChat` | `components/live/LiveChat.tsx` | WebSocket chat sidebar |
| `FeaturedProduct` | `components/live/FeaturedProduct.tsx` | Product card with Buy Now button |
| `StreamSetup` | `components/live/StreamSetup.tsx` | Camera preview + session form |
| `SellerBio` | `components/SellerBio.tsx` | Reusable bio display (product page, live page) |

---

## 8. Navigation Changes

- **Navbar**: Add "Live" link between "Discover" and "Origin" (both desktop and mobile)
- **Dashboard**: Add "Go Live" button for users who have listed products

---

## 9. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Viewer delivery | HLS (not WebRTC mesh) | Scales to unlimited viewers, ~5-10s latency is fine for shopping |
| Products per session | One | Each stream is about one specific creation |
| Role model | No roles — any user can sell/stream | Simplicity, matches user request |
| Bio scope | Profile-level, not per-product | One bio reused across products and streams |
| Chat transport | WebSocket | Already adding WS for signaling, reuse infrastructure |
| Recording storage | Firebase Storage | Consistent with existing media storage, enables reels conversion |
| Signaling server | Built into FastAPI | Single codebase, simpler deployment |

---

## 10. Out of Scope

- Multi-product switching during a stream (future enhancement)
- Screen sharing
- Viewer-to-seller video calls
- Monetization (tips, super chats)
- Stream quality selection (adaptive bitrate)
- Push notifications for "going live"
