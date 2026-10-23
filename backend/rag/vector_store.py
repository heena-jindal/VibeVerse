"""
All direct database access for users, journal entries, and chat messages
lives here. Nothing else in the app should write raw SQL; it calls these
functions instead.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from pgvector.psycopg2 import register_vector

from rag.embeddings import embed_text

DATABASE_URL = os.environ["DATABASE_URL"]


def get_connection():
    conn = psycopg2.connect(DATABASE_URL)
    register_vector(conn)
    return conn


# ---------- Writing ----------

def save_journal_entry(user_id: int, content: str, mood_label: str | None = None) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO journal_entries (user_id, content, mood_label)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (user_id, content, mood_label),
            )
            new_id = cur.fetchone()[0]
        conn.commit()
    return new_id


def save_chat_message(user_id: int, role: str, content: str, mood_label: str | None = None) -> int:
    embedding = embed_text(content)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages (user_id, role, content, mood_label, embedding)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, role, content, mood_label, embedding),
            )
            new_id = cur.fetchone()[0]
        conn.commit()
    return new_id


# ---------- Similarity search (used for memory) ----------

def search_journal_entries(user_id: int, query_embedding: list[float], limit: int = 10) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, content, mood_label, created_at,
                       embedding <=> %s::vector AS distance
                FROM journal_entries
                WHERE user_id = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_embedding, user_id, query_embedding, limit),
            )
            return cur.fetchall()


def search_chat_messages(user_id: int, query_embedding: list[float], limit: int = 10) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, role, content, mood_label, created_at,
                       embedding <=> %s::vector AS distance
                FROM chat_messages
                WHERE user_id = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_embedding, user_id, query_embedding, limit),
            )
            return cur.fetchall()


# ---------- Plain listing (Journal page, History page, Music) ----------

def get_journal_entries(user_id: int, limit: int = 30) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, content, mood_label, created_at
                FROM journal_entries
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit),
            )
            return cur.fetchall()


def get_journal_stats(user_id: int) -> dict:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM journal_entries WHERE user_id = %s", (user_id,))
            total = cur.fetchone()["total"]

            cur.execute(
                """
                SELECT mood_label, COUNT(*) AS count
                FROM journal_entries
                WHERE user_id = %s AND mood_label IS NOT NULL
                GROUP BY mood_label
                ORDER BY count DESC
                """,
                (user_id,),
            )
            mood_counts = cur.fetchall()

    return {"total": total, "mood_counts": mood_counts}


def delete_journal_entry(entry_id: int, user_id: int):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM journal_entries WHERE id = %s AND user_id = %s",
                (entry_id, user_id),
            )
        conn.commit()


def get_recent_chats(user_id: int, limit: int = 20) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, role, content, mood_label, created_at
                FROM chat_messages
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit * 2),
            )
            rows = cur.fetchall()

    rows.reverse()
    pairs = []
    pending_user = None
    for row in rows:
        if row["role"] == "user":
            pending_user = row
        elif row["role"] == "assistant" and pending_user is not None:
            pairs.append({
                "id": pending_user["id"],
                "user_message": pending_user["content"],
                "mood": row["mood_label"],
                "bot_reply": row["content"],
                "timestamp": row["created_at"],
            })
            pending_user = None

    pairs.reverse()
    return pairs[:limit]


def get_mood_counts(user_id: int) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT mood_label AS mood, COUNT(*) AS count
                FROM chat_messages
                WHERE user_id = %s AND role = 'assistant' AND mood_label IS NOT NULL
                GROUP BY mood_label
                ORDER BY count DESC
                """,
                (user_id,),
            )
            return cur.fetchall()


def get_latest_mood(user_id: int) -> str | None:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT mood_label FROM chat_messages
                WHERE user_id = %s AND role = 'assistant' AND mood_label IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (user_id,),
            )
            row = cur.fetchone()
            return row["mood_label"] if row else None

def get_recent_messages(user_id: int, limit: int = 6) -> list[dict]:
    """The last few chat messages, oldest first, so the bot can follow the conversation."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT role, content FROM chat_messages
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit),
            )
            rows = cur.fetchall()
    rows.reverse()
    return rows
