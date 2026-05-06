from __future__ import annotations

import logging
import re
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


def sanitize_filename(value: str, fallback: str = "story-video") -> str:
    value = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip().lower())
    value = re.sub(r"-+", "-", value).strip("-._")
    return value or fallback


def ffprobe_duration(path: str | Path) -> float | None:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return float(result.stdout.strip())
    except Exception:
        return None


def _font_file(configured: str | None = None) -> str | None:
    if configured and Path(configured).exists():
        return str(Path(configured).resolve())

    candidates: list[Path]
    if sys.platform == "win32":
        candidates = [Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/segoeui.ttf")]
    elif sys.platform == "darwin":
        candidates = [Path("/System/Library/Fonts/Supplemental/Arial.ttf")]
    else:
        candidates = [
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
        ]

    for candidate in candidates:
        if candidate.exists():
            return str(candidate.resolve())
    return None


def _escape_drawtext(value: str) -> str:
    value = (value or "").replace("\n", " ")
    value = value.replace("\\", "\\\\")
    value = value.replace(":", "\\:")
    value = value.replace("'", "\\'")
    value = value.replace("%", "\\%")
    value = value.replace("[", "\\[")
    value = value.replace("]", "\\]")
    return value


def _escape_filter_path(path: str) -> str:
    escaped = path.replace("\\", "/")
    if sys.platform == "win32":
        escaped = escaped.replace(":", "\\:")
    return escaped.replace("'", "\\'")


def _text_y(position: str, height: int) -> str:
    if position == "top":
        return str(int(height * 0.13))
    if position == "middle":
        return "(h-text_h)/2"
    return str(int(height * 0.78))


def _drawtext_filter(text: str, position: str, width: int, height: int, font_path: str | None) -> str:
    text = _escape_drawtext(_limit_overlay_text(text))
    if not text:
        return ""

    font_size = max(42, int(width * 0.055))
    x_expr = "(w-text_w)/2"
    y_expr = _text_y(position, height)
    parts = [
        "drawtext",
        f"text='{text}'",
        f"x={x_expr}",
        f"y={y_expr}",
        f"fontsize={font_size}",
        "fontcolor=white",
        "line_spacing=12",
        "box=1",
        "boxcolor=black@0.48",
        "boxborderw=28",
        "shadowcolor=black@0.55",
        "shadowx=3",
        "shadowy=3",
    ]
    if font_path:
        parts.insert(1, f"fontfile='{_escape_filter_path(font_path)}'")
    return ":".join(parts)


def _limit_overlay_text(text: str) -> str:
    words = [word for word in re.sub(r"\s+", " ", text or "").strip().split(" ") if word]
    return " ".join(words[:7])


def _zoompan_for_effect(effect: str, frames: int, width: int, height: int, fps: int) -> str:
    if effect == "slow_zoom_out":
        z_expr = "if(eq(on,0),1.12,max(1.0,zoom-0.0012))"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = "ih/2-(ih/zoom/2)"
    elif effect == "pan_left":
        z_expr = "1.10"
        x_expr = "(iw-iw/zoom)*(1-on/{frames})"
        y_expr = "ih/2-(ih/zoom/2)"
    elif effect == "pan_right":
        z_expr = "1.10"
        x_expr = "(iw-iw/zoom)*(on/{frames})"
        y_expr = "ih/2-(ih/zoom/2)"
    elif effect == "hold":
        z_expr = "1.0"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = "ih/2-(ih/zoom/2)"
    elif effect == "detail_zoom":
        z_expr = "min(zoom+0.0022,1.18)"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = "ih/2-(ih/zoom/2)"
    else:
        z_expr = "min(zoom+0.0012,1.12)"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = "ih/2-(ih/zoom/2)"

    x_expr = x_expr.format(frames=max(frames - 1, 1))
    y_expr = y_expr.format(frames=max(frames - 1, 1))
    return f"zoompan=z='{z_expr}':x='{x_expr}':y='{y_expr}':d={frames}:s={width}x{height}:fps={fps}"


def _scene_filter(scene: dict[str, Any], duration: int, width: int, height: int, fps: int, font_path: str | None) -> str:
    frames = max(duration * fps, 1)
    transition = scene.get("transition", "fade")
    fade_duration = min(0.45, max(duration / 4, 0.15))
    filters = [
        f"scale={width}:{height}:force_original_aspect_ratio=increase",
        f"crop={width}:{height}",
        _zoompan_for_effect(str(scene.get("cameraEffect") or "slow_zoom_in"), frames, width, height, fps),
    ]

    if transition == "fade":
        filters.append(f"fade=t=in:st=0:d={fade_duration:.2f}")
        filters.append(f"fade=t=out:st={max(duration - fade_duration, 0):.2f}:d={fade_duration:.2f}")

    drawtext = _drawtext_filter(
        str(scene.get("overlayText") or ""),
        str(scene.get("textPosition") or "bottom"),
        width,
        height,
        font_path,
    )
    if drawtext:
        filters.append(drawtext)

    filters.extend(["format=yuv420p", "setsar=1"])
    return ",".join(filters)


def _run(command: list[str], label: str) -> None:
    logger.info("Running %s: %s", label, " ".join(command))
    subprocess.run(command, check=True)


def _render_scene(
    image_path: str,
    scene: dict[str, Any],
    output_path: Path,
    *,
    width: int,
    height: int,
    fps: int,
    font_path: str | None,
) -> None:
    duration = max(int(scene.get("duration") or 1), 1)
    command = [
        "ffmpeg",
        "-y",
        "-loop",
        "1",
        "-t",
        str(duration),
        "-i",
        str(Path(image_path).resolve()),
        "-vf",
        _scene_filter(scene, duration, width, height, fps, font_path),
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-r",
        str(fps),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output_path.resolve()),
    ]
    _run(command, f"scene {scene.get('sceneNumber')}")


def _concat_scenes(scene_paths: list[Path], output_path: Path, temp_dir: Path) -> None:
    concat_file = temp_dir / "concat.txt"
    lines = []
    for path in scene_paths:
        safe_path = str(path.resolve()).replace("\\", "/").replace("'", "'\\''")
        lines.append(f"file '{safe_path}'")
    concat_file.write_text("\n".join(lines), encoding="utf-8")
    command = [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat_file.resolve()),
        "-c",
        "copy",
        str(output_path.resolve()),
    ]
    _run(command, "scene concat")


def _mux_audio(
    video_path: Path,
    output_path: Path,
    *,
    audio_path: str | None,
    background_music_path: str | None,
    background_music_volume: float,
) -> None:
    if not audio_path and not background_music_path:
        shutil.copy2(video_path, output_path)
        return

    inputs = ["ffmpeg", "-y", "-i", str(video_path.resolve())]
    filter_complex = None
    audio_map = None

    has_narration = bool(audio_path and Path(audio_path).exists())
    has_music = bool(background_music_path and Path(background_music_path).exists())

    if has_narration:
        inputs.extend(["-i", str(Path(str(audio_path)).resolve())])
    if has_music:
        inputs.extend(["-stream_loop", "-1", "-i", str(Path(str(background_music_path)).resolve())])

    if has_narration and has_music:
        narration_index = 1
        music_index = 2
        filter_complex = (
            f"[{music_index}:a]volume={float(background_music_volume):.3f}[bg];"
            f"[{narration_index}:a]volume=1.0[voice];"
            "[voice][bg]amix=inputs=2:duration=first:dropout_transition=0[aout]"
        )
        audio_map = "[aout]"
    elif has_narration:
        audio_map = "1:a:0"
    elif has_music:
        filter_complex = f"[1:a]volume={float(background_music_volume):.3f}[aout]"
        audio_map = "[aout]"

    command = inputs[:]
    if filter_complex:
        command.extend(["-filter_complex", filter_complex])
    command.extend(["-map", "0:v:0"])
    if audio_map:
        command.extend(["-map", audio_map])
    command.extend(
        [
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(output_path.resolve()),
        ]
    )
    _run(command, "audio mux")


def render_storyboard_video(
    storyboard: dict[str, Any],
    image_paths: list[str],
    *,
    audio_path: str | None = None,
    output_dir: str | Path | None = None,
    temp_dir: str | Path | None = None,
    width: int | None = None,
    height: int | None = None,
    fps: int | None = None,
    font_path: str | None = None,
    background_music_path: str | None = None,
    background_music_volume: float | None = None,
) -> str:
    if not image_paths:
        raise ValueError("At least one product image is required")

    resolved_images = [str(Path(path).resolve()) for path in image_paths]
    for path in resolved_images:
        if not Path(path).exists():
            raise ValueError(f"Product image does not exist: {path}")

    output_root = Path(output_dir or settings.STORYBOARD_OUTPUT_DIR)
    temp_root = Path(temp_dir or settings.STORYBOARD_TEMP_DIR) / str(uuid.uuid4())
    output_root.mkdir(parents=True, exist_ok=True)
    temp_root.mkdir(parents=True, exist_ok=True)

    render_width = int(width or settings.STORYBOARD_VIDEO_WIDTH)
    render_height = int(height or settings.STORYBOARD_VIDEO_HEIGHT)
    render_fps = int(fps or settings.STORY_VIDEO_FPS)
    render_font = _font_file(font_path or settings.STORY_FONT_PATH)
    music_path = background_music_path if background_music_path is not None else settings.STORYBOARD_BACKGROUND_MUSIC_PATH
    music_volume = float(background_music_volume if background_music_volume is not None else settings.STORYBOARD_BACKGROUND_MUSIC_VOLUME)

    title_slug = sanitize_filename(str(storyboard.get("title") or "story-video"))
    scene_paths: list[Path] = []

    try:
        for scene in storyboard.get("scenes", []):
            image_index = int(scene.get("imageIndex", 0)) % len(resolved_images)
            scene_number = int(scene.get("sceneNumber", len(scene_paths) + 1))
            scene_path = temp_root / f"scene-{scene_number:02d}.mp4"
            _render_scene(
                resolved_images[image_index],
                scene,
                scene_path,
                width=render_width,
                height=render_height,
                fps=render_fps,
                font_path=render_font,
            )
            scene_paths.append(scene_path)

        if not scene_paths:
            raise ValueError("Storyboard must contain at least one scene")

        silent_video = temp_root / "storyboard-silent.mp4"
        _concat_scenes(scene_paths, silent_video, temp_root)

        final_path = output_root / f"{title_slug}-{uuid.uuid4().hex[:8]}.mp4"
        _mux_audio(
            silent_video,
            final_path,
            audio_path=audio_path,
            background_music_path=music_path,
            background_music_volume=music_volume,
        )
        logger.info("Storyboard video rendered to %s", final_path)
        return str(final_path)
    finally:
        if not bool(getattr(settings, "STORYBOARD_KEEP_TEMP", False)):
            shutil.rmtree(temp_root, ignore_errors=True)
