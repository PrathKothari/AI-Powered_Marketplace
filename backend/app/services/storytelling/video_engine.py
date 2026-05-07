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


def _resolve_font() -> str | None:
    """Return a usable font file path, or None if none can be found."""
    configured = getattr(settings, "STORY_FONT_PATH", "").strip()
    if configured and Path(configured).exists():
        return str(Path(configured).resolve())

    if sys.platform == "darwin":
        candidates = [
            "/Library/Fonts/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    elif sys.platform == "win32":
        candidates = [
            "C:/Windows/Fonts/arial.ttf",
        ]
    else:  # Linux / other
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]

    for path in candidates:
        if Path(path).exists():
            return path

    return None


def _build_drawtext(text: str, y_pos: str, fontsize: int) -> str:
    # Skip text overlays — drawtext requires FFmpeg built with libfreetype,
    # which the default Homebrew bottle on Apple Silicon lacks.
    return ""
    font = _resolve_font()
    if not font:
        return ""
    safe = _escape_drawtext(text)
    return (
        f"drawtext=fontfile='{font}':text='{safe}':"
        f"fontsize={fontsize}:fontcolor=white:x=(w-tw)/2:y={y_pos}:"
        f"shadowx=2:shadowy=2:shadowcolor=black@0.6:"
        f"box=1:boxcolor=black@0.3:boxborderw=8"
    )


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
        overlays.append(_build_drawtext(hook, y_pos="220", fontsize=78))
        overlays.append(_build_drawtext(main, y_pos="350", fontsize=46))

    overlays.append(_build_drawtext(caption, y_pos="1320", fontsize=52))

    if index == image_count - 1:
        overlays.append(_build_drawtext(cta, y_pos="1580", fontsize=64))

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


def get_transitions_for_style(style_preset: str) -> list[str]:
    """Return a list of xfade transition names appropriate for the given style preset."""
    mapping: dict[str, list[str]] = {
        "museum_cinematic": ["fade", "fadeblack"],
        "artisan_story": ["circlecrop", "distance"],
        "editorial_premium": ["wipeleft", "wiperight"],
        "modern_minimal": ["fade"],
    }
    return mapping.get(style_preset, ["fade"])


def render_single_image_three_pass(
    image_path: str,
    creative: dict,
    tts_path: str | None,
    output_path: str,
    fps: int = 30,
) -> str:
    """
    Render a 3-pass ~20 s video from a single image using FFmpeg zoompan.

    Pass 1 (0–7 s)  : slow zoom-in  + hook text overlay (top, y≈100)
    Pass 2 (7–14 s) : slow pan-left + scene_caption[0] overlay (bottom third)
    Pass 3 (14–20 s): slow zoom-out + cta text overlay (bottom)

    The three clips are stitched with fade transitions and TTS audio is mixed
    in if provided.  Returns output_path.
    """
    pass_duration = 7          # seconds per pass
    frames = pass_duration * fps   # 210 frames per pass
    fade_d = 0.5               # cross-fade duration in seconds

    source = str(Path(image_path).resolve())
    tmp_dir = OUTPUT_DIR

    hook_text = str(creative.get("hook", ""))
    captions = creative.get("scene_captions", [""])
    caption_text = str(captions[0]) if captions else ""
    cta_text = str(creative.get("cta", ""))

    # ---------- helpers -------------------------------------------------------
    def _dt(text: str, y_pos: str, fontsize: int) -> str:
        return _build_drawtext(text, y_pos=y_pos, fontsize=fontsize)

    # ---------- pass 1: zoom-in -----------------------------------------------
    p1_out = tmp_dir / f"{uuid.uuid4()}_p1.mp4"
    p1_filter = (
        f"[0:v]"
        f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
        f"zoompan=z='min(zoom+0.0015,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s=1080x1920:fps={fps},"
        f"fade=t=in:st=0:d={fade_d},"
        f"fade=t=out:st={pass_duration - fade_d:.2f}:d={fade_d},"
        f"format=yuv420p,setsar=1"
    )
    hook_dt = _dt(hook_text, y_pos="100", fontsize=78)
    if hook_dt:
        p1_filter += f",{hook_dt}"
    p1_filter += "[outv]"
    subprocess.run(
        ["ffmpeg", "-y", "-loop", "1", "-i", source,
         "-filter_complex", p1_filter,
         "-map", "[outv]", "-pix_fmt", "yuv420p", "-r", str(fps),
         "-t", str(pass_duration), str(p1_out)],
        check=True,
    )

    # ---------- pass 2: pan-left ----------------------------------------------
    p2_out = tmp_dir / f"{uuid.uuid4()}_p2.mp4"
    # Pan from right to left: x goes from 0 → (scaled_w - 1080)
    p2_filter = (
        f"[0:v]"
        f"scale=1440:1920:force_original_aspect_ratio=increase,crop=1440:1920,"
        f"zoompan=z='1.0':x='(iw-1080)*on/{frames}':y='0'"
        f":d={frames}:s=1080x1920:fps={fps},"
        f"fade=t=in:st=0:d={fade_d},"
        f"fade=t=out:st={pass_duration - fade_d:.2f}:d={fade_d},"
        f"format=yuv420p,setsar=1"
    )
    cap_dt = _dt(caption_text, y_pos="h*2/3", fontsize=52)
    if cap_dt:
        p2_filter += f",{cap_dt}"
    p2_filter += "[outv]"
    subprocess.run(
        ["ffmpeg", "-y", "-loop", "1", "-i", source,
         "-filter_complex", p2_filter,
         "-map", "[outv]", "-pix_fmt", "yuv420p", "-r", str(fps),
         "-t", str(pass_duration), str(p2_out)],
        check=True,
    )

    # ---------- pass 3: zoom-out ----------------------------------------------
    p3_out = tmp_dir / f"{uuid.uuid4()}_p3.mp4"
    p3_filter = (
        f"[0:v]"
        f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
        f"zoompan=z='max(zoom-0.0015,1.00)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s=1080x1920:fps={fps},"
        f"fade=t=in:st=0:d={fade_d},"
        f"fade=t=out:st={pass_duration - fade_d:.2f}:d={fade_d},"
        f"format=yuv420p,setsar=1"
    )
    cta_dt = _dt(cta_text, y_pos="h-100", fontsize=64)
    if cta_dt:
        p3_filter += f",{cta_dt}"
    p3_filter += "[outv]"
    subprocess.run(
        ["ffmpeg", "-y", "-loop", "1", "-i", source,
         "-filter_complex", p3_filter,
         "-map", "[outv]", "-pix_fmt", "yuv420p", "-r", str(fps),
         "-t", str(pass_duration), str(p3_out)],
        check=True,
    )

    # ---------- stitch with fade transitions ----------------------------------
    total_duration = pass_duration * 3  # 21 s (overlap accounted for by xfade offset)
    stitch_filter = (
        f"[0:v][1:v]xfade=transition=fade:duration={fade_d}:offset={pass_duration - fade_d}[x01];"
        f"[x01][2:v]xfade=transition=fade:duration={fade_d}:offset={2 * pass_duration - 2 * fade_d}[outv]"
    )
    base_out = tmp_dir / f"{uuid.uuid4()}_3pass_base.mp4"
    subprocess.run(
        ["ffmpeg", "-y",
         "-i", str(p1_out), "-i", str(p2_out), "-i", str(p3_out),
         "-filter_complex", stitch_filter,
         "-map", "[outv]", "-pix_fmt", "yuv420p", "-r", str(fps),
         str(base_out)],
        check=True,
    )

    # Clean up intermediate clips
    for tmp in (p1_out, p2_out, p3_out):
        try:
            tmp.unlink()
        except OSError:
            pass

    # ---------- mix TTS audio -------------------------------------------------
    if tts_path and Path(tts_path).exists():
        subprocess.run(
            ["ffmpeg", "-y",
             "-i", str(base_out), "-i", tts_path,
             "-map", "0:v:0", "-map", "1:a:0",
             "-shortest", "-c:v", "copy", "-c:a", "aac",
             output_path],
            check=True,
        )
        try:
            base_out.unlink()
        except OSError:
            pass
    else:
        Path(base_out).rename(output_path)

    return output_path


def render_video(image_paths: List[str], creative: Dict[str, Any] | None = None, audio_path: str | None = None, duration_per_image: int | None = None, style_preset: str = "museum_cinematic", output_path: str | None = None) -> str:
    if not image_paths:
        raise ValueError("At least one product image is required")

    if creative is None:
        creative = {}

    if len(image_paths) == 1:
        resolved_output = output_path or str(OUTPUT_DIR / f"{uuid.uuid4()}_3pass.mp4")
        return render_single_image_three_pass(
            image_path=image_paths[0],
            creative=creative,
            tts_path=audio_path,
            output_path=resolved_output,
        )

    duration_seconds = max(int(duration_per_image or settings.STORY_SECONDS_PER_IMAGE), 1)
    fps = int(settings.STORY_VIDEO_FPS)
    transition_duration = 0.5  # seconds for each transition

    source_paths = [str(Path(path).resolve()) for path in image_paths]
    base_output = OUTPUT_DIR / f"{uuid.uuid4()}.mp4"

    ffmpeg_args: List[str] = ["ffmpeg", "-y"]
    for path in source_paths:
        ffmpeg_args.extend(["-i", path])

    # Select transitions based on the style preset
    transitions = get_transitions_for_style(style_preset)

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

    final_filter_chain = "".join(filter_parts).rstrip(";")

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

    ffmpeg_args: List[str] = ["ffmpeg", "-y", "-loop", "1", "-i", source_path]

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