# AI-Powered Artisan Marketplace - Backend

## Overview
This is the FastAPI backend for the AI-Powered Artisan Marketplace. It is designed to be scalable, modular, and event-driven.

## Project Structure
- `app/api`: API route definitions
- `app/core`: Core application configuration, security, and utilities
- `app/db`: Database connection and models
- `app/ml`: AI/ML pipelines and model management
- `app/schemas`: Pydantic models for request/response validation
- `app/services`: Business logic and service layers
- `app/workers`: Background tasks (Celery/ARQ)

## Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
   The backend reads .env.local first, then .env.
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Development
- **Docs**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc

## Storytelling APIs

- POST /api/v1/storytelling/generate-video
   - multipart form-data
   - required: description, files
   - optional: product_name, tone, audience, style_preset, duration_per_image

- POST /api/v1/storytelling/generate-copy
   - multipart form-data
   - required: description
   - optional: image_count, product_name, tone, audience, style_preset

- GET /api/v1/storytelling/styles
   - returns available creative presets

## Included presets

- museum_cinematic
- artisan_story
- editorial_premium
- modern_minimal

## Notes

- If Google Cloud Storage credentials are configured, the rendered video is uploaded there.
- Otherwise, the backend stores the file locally and serves it from /media/videos/...
- The story video pipeline runs locally with FFmpeg. Gemini is used only for storyboard/script JSON when `GEMINI_API_KEY` is set. If Gemini is unavailable, OpenAI is tried when `OPENAI_API_KEY` and the `openai` package are available. If neither key works, a local 5-scene storyboard template is used.
- The renderer uses uploaded product images, scene-by-scene camera effects, fade transitions, readable text overlays, optional narration audio, and optional low-volume background music.

## Local story video generation

Required local tools:

```bash
ffmpeg -version
ffprobe -version
```

Optional environment variables:

```bash
GEMINI_API_KEY="..."
OPENAI_API_KEY="..."
STORY_FONT_PATH="C:/Windows/Fonts/arial.ttf"
STORYBOARD_BACKGROUND_MUSIC_PATH="assets/music.mp3"
STORYBOARD_BACKGROUND_MUSIC_VOLUME=0.12
```

Run the backend API:

```bash
cd backend
uvicorn app.main:app --reload --port 8001
```

Run the local example without the frontend:

```bash
cd backend
python examples/generate_story_video_local.py --image ./sample-product.jpg --name "Handmade Ceramic Mug" --price "Rs. 899" --type "Ceramic craft"
```

Generated storyboard JSON is saved under `generated-videos/storyboards/.../storyboard.json`. Final MP4 files are saved under `generated-videos/` and copied to `/media/videos/...` when cloud storage is not configured.
