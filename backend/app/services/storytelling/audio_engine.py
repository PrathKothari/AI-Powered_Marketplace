from __future__ import annotations

import os
import uuid
from pathlib import Path

from google.cloud.texttospeech_v1.services.text_to_speech import TextToSpeechClient
from google.cloud.texttospeech_v1.types import SynthesisInput, VoiceSelectionParams, AudioConfig, AudioEncoding

from app.core.config import settings

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

client = TextToSpeechClient()

def generate_audio_from_text(text: str) -> str:
    """
    Generates an audio file from the given text using Google Cloud TTS.
    """
    synthesis_input = SynthesisInput(text=text)

    # Build the voice request, select a language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = VoiceSelectionParams(
        language_code="en-US", ssml_gender="NEUTRAL"
    )

    # Select the type of audio file you want returned
    audio_config = AudioConfig(
        audio_encoding=AudioEncoding.MP3
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    # The response's audio_content is binary.
    output_path = TEMP_DIR / f"{uuid.uuid4()}.mp3"
    with open(output_path, "wb") as out:
        # Write the response to the output file.
        out.write(response.audio_content)
        print(f'Audio content written to file "{output_path}"')

    return str(output_path)
