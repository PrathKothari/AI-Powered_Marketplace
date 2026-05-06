from __future__ import annotations

import logging
import uuid
from pathlib import Path
import shlex
import subprocess
import math

from app.core.config import settings

logger = logging.getLogger(__name__)

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(parents=True, exist_ok=True)


def _get_tts_client():
    """Lazily initialize the TTS client. Returns None if credentials are missing."""
    try:
        from google.cloud.texttospeech_v1.services.text_to_speech import TextToSpeechClient
        return TextToSpeechClient()
    except Exception as e:
        logger.warning("Google TTS client unavailable: %s", e)
        return None


def _ffprobe_duration(path: str) -> float | None:
    try:
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ]
        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT)
        return float(output.strip())
    except Exception:
        return None


def fit_audio_to_duration(audio_path: str, target_seconds: float) -> str | None:
    """Trim or pad audio so it matches the requested duration.

    This keeps the narration track aligned with the final video length without
    re-rendering the visuals.
    """
    source = Path(audio_path)
    if not source.exists():
        return None

    target_seconds = max(float(target_seconds), 0.1)
    output_path = TEMP_DIR / f"{uuid.uuid4()}_fit.mp3"

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(source.resolve()),
        "-af",
        "apad",
        "-t",
        f"{target_seconds:.2f}",
        "-c:a",
        "libmp3lame",
        str(output_path.resolve()),
    ]

    try:
        subprocess.run(cmd, check=True)
        return str(output_path)
    except Exception as e:
        logger.warning("Audio duration fitting failed: %s", e)
        return None


def generate_audio_from_text(
    text: str,
    *,
    language_code: str | None = None,
    voice_name: str | None = None,
    speaking_rate: float | None = None,
    pitch: float | None = None,
    audio_encoding: str = "MP3",
    mix_with_music: bool = True,
) -> str | None:
    """
    Generate TTS audio with optional voice/rate/pitch controls and mix with
    background music (if available). Returns the local path to the generated
    audio file or None on failure.
    """
    client = _get_tts_client()
    if client is None:
        return None

    try:
        from google.cloud.texttospeech_v1.types import (
            SynthesisInput,
            VoiceSelectionParams,
            AudioConfig,
            AudioEncoding,
        )

        synthesis_input = SynthesisInput(text=text)

        lang = language_code or settings.STORY_TTS_LANGUAGE
        voice = VoiceSelectionParams(language_code=lang)
        if voice_name:
            # Some clients prefer setting name; safe to add attribute if present
            try:
                setattr(voice, "name", voice_name)
            except Exception:
                pass

        # Configure audio
        encoding = getattr(AudioEncoding, audio_encoding, AudioEncoding.MP3)
        audio_config = AudioConfig(audio_encoding=encoding)
        if speaking_rate is None:
            speaking_rate = float(settings.STORY_TTS_SPEAKING_RATE)
        if pitch is None:
            pitch = float(settings.STORY_TTS_PITCH)
        try:
            # set optional fields if supported
            setattr(audio_config, "speaking_rate", float(speaking_rate))
            setattr(audio_config, "pitch", float(pitch))
        except Exception:
            pass

        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        output_path = TEMP_DIR / f"{uuid.uuid4()}.mp3"
        output_path.write_bytes(response.audio_content)
        logger.info("Audio content written to %s", output_path)

        final_path = str(output_path)

        # Optionally mix with background music using FFmpeg
        if mix_with_music and settings.STORY_DEFAULT_MUSIC:
            music_path = Path(settings.STORY_DEFAULT_MUSIC)
            if music_path.exists():
                # Determine duration of TTS audio
                duration = _ffprobe_duration(final_path) or 0
                if duration > 0:
                    mixed_out = TEMP_DIR / f"{uuid.uuid4()}_mixed.mp3"
                    music_vol = float(settings.STORY_MUSIC_VOLUME or 0.15)

                    # Build ffmpeg command to loop music and mix with TTS
                    # -stream_loop -1 to loop music, -t to cut to duration
                    cmd = [
                        "ffmpeg",
                        "-y",
                        "-stream_loop",
                        "-1",
                        "-i",
                        str(music_path.resolve()),
                        "-i",
                        str(output_path.resolve()),
                        "-t",
                        f"{duration}",
                        "-filter_complex",
                        f"[0:a]volume={music_vol}[bg];[1:a]volume=1.0[voice];[bg][voice]amix=inputs=2:duration=shortest,aresample=async=1",
                        "-c:a",
                        "mp3",
                        str(mixed_out.resolve()),
                    ]

                    try:
                        subprocess.run(cmd, check=True)
                        final_path = str(mixed_out)
                    except Exception as e:
                        logger.warning("Background music mixing failed: %s", e)

        return final_path
    except Exception as e:
        logger.warning("TTS generation failed: %s", e)
        return None
