"""
Finds the past journal entries / chat messages most relevant to a new message.
Ranks by a blend of meaning-similarity and recency, and ignores anything
that isn't similar enough.
"""

import math
from datetime import datetime, timezone

from rag.embeddings import embed_text
from rag.vector_store import search_journal_entries, search_chat_messages

# Smaller = recency matters more. 14 means a 14-day-old entry has ~37% of its weight.
RECENCY_HALFLIFE_DAYS = 14

# Memories less similar than this are ignored completely.
# 0.5 is a starting guess. If unrelated memories still sneak in, raise it
# (try 0.6). If real memories stop being found, lower it (try 0.4).
MIN_SIMILARITY = 0.5


def _recency_weight(created_at: datetime) -> float:
    age_days = (datetime.now(timezone.utc) - created_at.replace(tzinfo=timezone.utc)).days
    return math.exp(-age_days / RECENCY_HALFLIFE_DAYS)


def _similarity_from_distance(distance: float) -> float:
    # pgvector's <=> is cosine distance (0 = identical, 2 = opposite).
    return 1 - (distance / 2)


def retrieve_memories(
    user_id: int,
    query_text: str,
    sources: tuple[str, ...] = ("journal", "chat"),
    top_k: int = 5,
    similarity_weight: float = 0.7,
    recency_weight: float = 0.3,
) -> list[dict]:
    query_embedding = embed_text(query_text)
    candidates = []

    if "journal" in sources:
        for row in search_journal_entries(user_id, query_embedding, limit=20):
            if (1 - row["distance"]) < MIN_SIMILARITY:
                continue
            sim = _similarity_from_distance(row["distance"])
            rec = _recency_weight(row["created_at"])
            score = similarity_weight * sim + recency_weight * rec
            candidates.append({
                "source": "journal",
                "content": row["content"],
                "mood_label": row["mood_label"],
                "created_at": row["created_at"],
                "score": score,
            })

    if "chat" in sources:
        for row in search_chat_messages(user_id, query_embedding, limit=20):
            if (1 - row["distance"]) < MIN_SIMILARITY:
                continue
            sim = _similarity_from_distance(row["distance"])
            rec = _recency_weight(row["created_at"])
            score = similarity_weight * sim + recency_weight * rec
            candidates.append({
                "source": "chat",
                "content": row["content"],
                "mood_label": row["mood_label"],
                "created_at": row["created_at"],
                "score": score,
            })

    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates[:top_k]


def format_memories_for_prompt(memories: list[dict]) -> str:
    if not memories:
        return "No relevant past entries found."

    lines = []
    for m in memories:
        label = f" (mood: {m['mood_label']})" if m.get("mood_label") else ""
        lines.append(f"- [{m['source']}{label}] {m['content']}")
    return "\n".join(lines)
