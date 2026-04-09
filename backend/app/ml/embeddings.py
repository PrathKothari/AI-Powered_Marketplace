"""
CLIP-based image embedding generator.
Uses openai/clip-vit-base-patch32 (512-dim output).
Model is loaded lazily on first call and cached for subsequent requests.
"""

import io
import logging
import os

import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

from app.core.config import settings

logger = logging.getLogger(__name__)

# Set HF token for authenticated downloads (avoids rate limits)
if settings.HF_TOKEN:
    os.environ["HF_TOKEN"] = settings.HF_TOKEN

_model = None
_processor = None


def _load_model():
    global _model, _processor
    if _model is None:
        logger.info("Loading CLIP model (first call)...")
        _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _model.set_grad_enabled = False
        logger.info("CLIP model loaded.")
    return _model, _processor


def get_image_embedding(image_bytes: bytes) -> list[float]:
    """Return a normalised 512-dim embedding for a raw image (bytes)."""
    model, processor = _load_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        output = model.get_image_features(**inputs)
    # Handle both tensor output and BaseModelOutputWithPooling
    if hasattr(output, "pooler_output"):
        features = output.pooler_output
    elif hasattr(output, "last_hidden_state"):
        features = output.last_hidden_state[:, 0, :]
    else:
        features = output
    features = features / torch.norm(features, dim=-1, keepdim=True)
    return features[0].tolist()
