from __future__ import annotations

import subprocess
import uuid
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
        return configured

    windows_font = Path("C:/Windows/Fonts/arial.ttf")
    if windows_font.exists():
        return str(windows_font)

    return None


def _build_drawtext(text: str, *, y: int, start: float, end: float, size: int, color: str) -> str:
    font_file = _font_file()
    parts = [
        "drawtext",
        f"text='{_escape_drawtext(text)}'",
        f"fontsize={size}",
        f"fontcolor={color}",
        "x=(w-text_w)/2",
        f"y={y}",
        "box=1",
        "boxcolor=black@0.35",
        "boxborderw=18",
        f"enable='between(t,{start:.2f},{end:.2f})'",
    ]
    if font_file:
        parts.insert(1, f"fontfile='{font_file.replace('\\', '/')}'")
    return ":".join(parts)


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
        f"format=yuv420p"
    )

    overlays = []
    if index == 0:
        overlays.append(_build_drawtext(hook, y=220, start=0.0, end=min(duration_seconds, 2.8), size=78, color="white"))
        overlays.append(_build_drawtext(main, y=350, start=0.4, end=min(duration_seconds, 3.8), size=46, color="white"))

    overlays.append(_build_drawtext(caption, y=1320, start=0.0, end=duration_seconds, size=52, color="white"))

    if index == image_count - 1:
        overlays.append(_build_drawtext(cta, y=1580, start=max(duration_seconds - 2.2, 0), end=duration_seconds, size=64, color="yellow"))

    clip += "," + ",".join(overlays)
    clip += f"[v{index}]"
    return clip


def _attach_music(video_path: Path) -> Path:
    music_path = Path(settings.STORY_DEFAULT_MUSIC)
    if not music_path.exists():
        return video_path

    final_output = OUTPUT_DIR / f"{uuid.uuid4()}_final.mp4"
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-stream_loop",
        "-1",
        "-i",
        str(music_path),
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


def render_video(image_paths: List[str], creative: Dict[str, Any], duration_per_image: int | None = None) -> str:
    if not image_paths:
        raise ValueError("At least one product image is required")

    duration_seconds = max(int(duration_per_image or settings.STORY_SECONDS_PER_IMAGE), 1)
    fps = int(settings.STORY_VIDEO_FPS)

    source_paths = [str(Path(path).resolve()) for path in image_paths]
    base_output = OUTPUT_DIR / f"{uuid.uuid4()}.mp4"

    ffmpeg_args: List[str] = ["ffmpeg", "-y"]
    for path in source_paths:
        ffmpeg_args.extend(["-i", path])

    filter_parts = []
    scene_captions = creative.get("scene_captions", []) or []
    if not scene_captions:
        scene_captions = [str(creative.get("title", "Product Story"))]

    for index in range(len(source_paths)):
        caption = scene_captions[index] if index < len(scene_captions) else scene_captions[-1]
        filter_parts.append(
            _clip_filter(
                index=index,
                image_count=len(source_paths),
                caption=str(caption),
                hook=str(creative.get("hook", "Discover More")),
                main=str(creative.get("main", "A premium product story.")),
                cta=str(creative.get("cta", "Shop Now")),
                duration_seconds=duration_seconds,
                fps=fps,
            )
        )

    concat_inputs = "".join(f"[v{idx}]" for idx in range(len(source_paths)))
    filter_parts.append(f"{concat_inputs}concat=n={len(source_paths)}:v=1:a=0[outv]")

    ffmpeg_args.extend(
        [
            "-filter_complex",
            ";".join(filter_parts),
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
    return str(_attach_music(base_output))