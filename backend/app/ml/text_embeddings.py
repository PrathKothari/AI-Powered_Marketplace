"""
Text embedding generator using sentence-transformers.
Uses all-mpnet-base-v2 (768-dim output) for semantic text search.
Model is loaded lazily on first call and cached for subsequent requests.
"""

import logging
from typing import List

from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)

_model = None


def _load_model():
    global _model
    if _model is None:
        logger.info("Loading text embedding model (all-mpnet-base-v2)...")
        _model = SentenceTransformer("all-mpnet-base-v2")
        logger.info("Text embedding model loaded.")
    return _model


def get_text_embedding(text: str) -> List[float]:
    """Return a normalised 768-dim embedding for a text string."""
    model = _load_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def get_text_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Return normalised 768-dim embeddings for a batch of text strings."""
    model = _load_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    return [e.tolist() for e in embeddings]
