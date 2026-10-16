-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Journal entries (embedding dimension matches the embedding model — 384 for
-- bge-small / all-MiniLM-L6-v2. Change this if you pick a different model.)
CREATE TABLE IF NOT EXISTS journal_entries (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    mood_label  TEXT,
    embedding   vector(384),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Chat messages (both user turns and bot replies, embedded the same way
-- so both can be retrieved as "memory")
CREATE TABLE IF NOT EXISTS chat_messages (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    mood_label  TEXT,
    embedding   vector(384),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Streaks (unchanged from your original design, just moved off SQLite)
CREATE TABLE IF NOT EXISTS streaks (
    user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active    DATE
);

-- Indexes for fast similarity search (IVFFlat; fine at this scale)
CREATE INDEX IF NOT EXISTS journal_embedding_idx
    ON journal_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS chat_embedding_idx
    ON chat_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
