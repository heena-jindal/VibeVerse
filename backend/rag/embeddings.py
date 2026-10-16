"""
Turns text into vectors (embeddings).

We use a local sentence-transformers model instead of an API-based embedding
model so there's no extra cost and no extra network dependency — it runs on
your machine. 'bge-small-en-v1.5' outputs 384-dimensional vectors, which is
why schema.sql uses vector(384). If you swap models, update that dimension
too.
"""

from sentence_transformers import SentenceTransformer

_model = None


def get_model() -> SentenceTransformer:
    """Lazy-load the model once and reuse it (loading is slow, embedding is fast)."""
    global _model
    if _model is None:
        _model = SentenceTransformer("BAAI/bge-small-en-v1.5")
    return _model


def embed_text(text: str) -> list[float]:
    """Embed a single piece of text. Returns a plain list of floats
    (psycopg2 / pgvector wants this, not a numpy array)."""
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts at once — more efficient than calling embed_text in a loop."""
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True)
    return [v.tolist() for v in vectors]
