from __future__ import annotations

import subprocess
import sys
import uuid
import random
from pathlib import Path
from typing import Any, Dict, List

from app.core.config import settings

OUTPUT_DIR = Path(settings.STORY_OUTPUT_DIR)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _escape_drawtext(text: str) -> str:
    escaped = text.replace("\\", r"\\")
    escaped = escaped.replace(":", r"\\:")
    escaped = escaped.replace("'", r"\\'")
    escaped = escaped.replace(",", r"\\,")
    escaped = escaped.replace("%", r"\\%")
    escaped = escaped.replace("\n", " ")
    return escaped


def _font_file() -> str | None:
    configured = settings.STORY_FONT_PATH.strip()
    if configured and Path(configured).exists():
        return str(Path(configured).resolve())

    if sys.platform == "win32":
        font_path = Path("C:/Windows/Fonts/arial.ttf")
        if font_path.exists():
            return str(font_path.resolve())
    elif sys.platform == "darwin":
        font_path = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
        if font_path.exists():
            return str(font_path.resolve())
    else: # Assuming Linux
        # Common paths for fonts on Linux
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/corefonts/arial.ttf"
        ]
        for path in font_paths:
            if Path(path).exists():
                return path

    return None


def _escape_ffmpeg_path(path: str) -> str:
    if sys.platform == "win32":
        return path.replace("\\", "/").replace(":", "\\:")
    return path

def _build_drawtext(text: str, *, y: int, start: float, end: float, size: int, color: str) -> str:
    # Bypass for font issue on Windows
    return ""


def _clip_filter(
    index: int,
    image_count: int,
    caption: str,
    hook: str,
    main: str,
    cta: str,
    duration_seconds: int,
    fps: int,
) -> str:
    frames = duration_seconds * fps
    fade = 0.5
    clip = (
        f"[{index}:v]"
        f"scale=1080:1920:force_original_aspect_ratio=increase,"
        f"crop=1080:1920,"
        f"zoompan=z='min(zoom+0.0012,1.10)':d={frames}:s=1080x1920:fps={fps},"
        f"fade=t=in:st=0:d={fade},"
        f"fade=t=out:st={max(duration_seconds - fade, 0):.2f}:d={fade},"
        f"format=yuv420p,"
        f"setsar=1"
    )

    overlays = []
    if index == 0:
        overlays.append(_build_drawtext(hook, y=220, start=0.0, end=min(duration_seconds, 2.8), size=78, color="white"))
        overlays.append(_build_drawtext(main, y=350, start=0.4, end=min(duration_seconds, 3.8), size=46, color="white"))

    overlays.append(_build_drawtext(caption, y=1320, start=0.0, end=duration_seconds, size=52, color="white"))

    if index == image_count - 1:
        overlays.append(_build_drawtext(cta, y=1580, start=max(duration_seconds - 2.2, 0), end=duration_seconds, size=64, color="yellow"))

    # Filter out empty strings from the overlays list
    valid_overlays = [o for o in overlays if o]
    if valid_overlays:
        clip += "," + ",".join(valid_overlays)
    clip += f"[v{index}]"
    return clip


def _attach_audio(video_path: Path, audio_path: str | None) -> Path:
    if not audio_path or not Path(audio_path).exists():
        return video_path

    final_output = OUTPUT_DIR / f"{uuid.uuid4()}_final.mp4"
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-i",
        str(audio_path),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-shortest",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        str(final_output),
    ]
    subprocess.run(command, check=True)
    return final_output


def render_video(image_paths: List[str], creative: Dict[str, Any], audio_path: str | None = None, duration_per_image: int | None = None) -> str:
    if not image_paths:
        raise ValueError("At least one product image is required")

    if len(image_paths) == 1:
        # If only one image, just do the basic clip filter and output
        return render_single_image_video(
            image_paths[0],
            creative,
            audio_path=audio_path,
            duration_per_image=duration_per_image,
        )

    duration_seconds = max(int(duration_per_image or settings.STORY_SECONDS_PER_IMAGE), 1)
    fps = int(settings.STORY_VIDEO_FPS)
    transition_duration = 0.5  # seconds for each transition

    source_paths = [str(Path(path).resolve()) for path in image_paths]
    base_output = OUTPUT_DIR / f"{uuid.uuid4()}.mp4"

    ffmpeg_args: List[str] = ["ffmpeg", "-y"]
    for path in source_paths:
        ffmpeg_args.extend(["-i", path])

    # List of 20 cool xfade transitions
    transitions = [
        "fade", "fadeblack", "fadewhite", "distance", "wipeleft", "wiperight", "wipeup",
        "wipedown", "slideleft", "slideright", "slideup", "slidedown", "circlecrop",
        "rectcrop", "circleopen", "circleclose", "horzopen", "horzclose", "vertopen", "vertclose"
    ]

    filter_parts = []
    
    # 1. Prepare each video stream with scaling, zoom, etc.
    for i in range(len(source_paths)):
        frames = duration_seconds * fps
        clip_filter = (
            f"[{i}:v]"
            f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
            f"zoompan=z='min(zoom+0.0012,1.10)':d={frames}:s=1080x1920:fps={fps},"
            f"format=yuv420p,setsar=1"
            f"[v{i}];"
        )
        filter_parts.append(clip_filter)

    # 2. Chain the streams with xfade transitions
    last_stream = "v0"
    for i in range(len(source_paths) - 1):
        transition = random.choice(transitions)
        next_stream = f"v{i+1}"
        output_stream = f"t{i}"
        
        # The offset is the start time of the transition for the next clip
        offset = (i + 1) * (duration_seconds - transition_duration)
        
        fade_filter = (
            f"[{last_stream}][{next_stream}]"
            f"xfade=transition={transition}:duration={transition_duration}:offset={offset}"
            f"[{output_stream}];"
        )
        filter_parts.append(fade_filter)
        last_stream = output_stream

    final_filter_chain = "".join(filter_parts)

    ffmpeg_args.extend(
        [
            "-filter_complex",
            final_filter_chain,
            "-map",
            f"[{last_stream}]",
            "-pix_fmt",
            "yuv420p",
            "-r",
            str(fps),
            str(base_output),
        ]
    )

    subprocess.run(ffmpeg_args, check=True)
    return str(_attach_audio(base_output, audio_path))


def render_single_image_video(image_path: str, creative: Dict[str, Any], audio_path: str | None = None, duration_per_image: int | None = None) -> str:
    duration_seconds = max(int(duration_per_image or settings.STORY_SECONDS_PER_IMAGE), 1)
    fps = int(settings.STORY_VIDEO_FPS)
    source_path = str(Path(image_path).resolve())
    base_output = OUTPUT_DIR / f"{uuid.uuid4()}.mp4"

    ffmpeg_args: List[str] = ["ffmpeg", "-y", "-i", source_path]

    # We can still add text overlays here if we want, but they are bypassed for now
    clip_filter_str = _clip_filter(
        index=0,
        image_count=1,
        caption=str(creative.get("scene_captions", [""])[0]),
        hook=str(creative.get("hook", "")),
        main=str(creative.get("main", "")),
        cta=str(creative.get("cta", "")),
        duration_seconds=duration_seconds,
        fps=fps,
    )

    # _clip_filter already adds [v0] at the end, remove it for single image case mapping
    filter_complex = clip_filter_str.replace("[v0]", "[outv]")

    ffmpeg_args.extend(
        [
            "-filter_complex",
            filter_complex,
            "-map",
            "[outv]",
            "-pix_fmt",
            "yuv420p",
            "-r",
            str(fps),
            str(base_output),
        ]
    )
    
    subprocess.run(ffmpeg_args, check=True)
    return str(_attach_audio(base_output, audio_path))