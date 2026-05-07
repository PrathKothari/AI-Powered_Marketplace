from __future__ import annotations

import logging
import uuid
from pathlib import Path

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


def generate_audio_from_text(text: str) -> str | None:
    """
    Generates an audio file from the given text using Google Cloud TTS.
    Returns None if TTS is unavailable (e.g., missing credentials).
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
        voice = VoiceSelectionParams(language_code="en-US", ssml_gender="NEUTRAL")
        audio_config = AudioConfig(audio_encoding=AudioEncoding.MP3)

        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        output_path = TEMP_DIR / f"{uuid.uuid4()}.mp3"
        output_path.write_bytes(response.audio_content)
        logger.info("Audio content written to %s", output_path)
        return str(output_path)
    except Exception as e:
        logger.warning("TTS generation failed: %s", e)
        return None
