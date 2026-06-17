# database.py — Complete final version

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()

    conn.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_message TEXT    NOT NULL,
            mood         TEXT    NOT NULL,
            situation    TEXT    NOT NULL,
            bot_reply    TEXT    NOT NULL,
            user_id      INTEGER DEFAULT 1,
            timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS mood_log (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            mood     TEXT    NOT NULL,
            date     DATE    DEFAULT (date('now')),
            polarity REAL    NOT NULL,
            user_id  INTEGER DEFAULT 1
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialised successfully.")


def add_user_id_columns():
    conn = get_connection()
    tables = ['chat_history', 'mood_log', 'journal_entries',
              'daily_challenge', 'streak_log']
    for table in tables:
        try:
            conn.execute(f'ALTER TABLE {table} ADD COLUMN user_id INTEGER DEFAULT 1')
            print(f"Added user_id to {table}")
        except Exception:
            pass
    conn.commit()
    conn.close()


# ── CHAT ─────────────────────────────────────────────────

def save_chat(user_message, mood, situation, bot_reply, user_id=1):
    conn = get_connection()
    conn.execute('''
        INSERT INTO chat_history
            (user_message, mood, situation, bot_reply, user_id)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_message, mood, situation, bot_reply, user_id))
    conn.commit()
    conn.close()


def save_mood(mood, polarity, user_id=1):
    conn = get_connection()
    conn.execute('''
        INSERT INTO mood_log (mood, polarity, user_id)
        VALUES (?, ?, ?)
    ''', (mood, polarity, user_id))
    conn.commit()
    conn.close()


def get_recent_chats(limit=20, user_id=1):
    conn = get_connection()
    cursor = conn.execute('''
        SELECT id, user_message, mood, situation, bot_reply, timestamp
        FROM chat_history
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_mood_counts(user_id=1):
    conn = get_connection()
    cursor = conn.execute('''
        SELECT mood, COUNT(*) as count
        FROM chat_history
        WHERE user_id = ?
        GROUP BY mood
        ORDER BY count DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ── CHALLENGES ────────────────────────────────────────────

def init_challenges():
    conn = get_connection()

    conn.execute('''
        CREATE TABLE IF NOT EXISTS challenges (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            description TEXT NOT NULL,
            difficulty  TEXT NOT NULL,
            category    TEXT NOT NULL
        )
    ''')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS daily_challenge (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id  INTEGER NOT NULL,
            assigned_date DATE DEFAULT (date('now')),
            completed_at  DATE,
            user_id       INTEGER DEFAULT 1,
            FOREIGN KEY (challenge_id) REFERENCES challenges(id)
        )
    ''')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS streak_log (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            completed_date DATE NOT NULL,
            user_id        INTEGER DEFAULT 1,
            UNIQUE(completed_date, user_id)
        )
    ''')

    conn.commit()

    count = conn.execute('SELECT COUNT(*) FROM challenges').fetchone()[0]

    if count == 0:
        challenges = [
            ("Smile at one person",
             "Make eye contact and smile at one person in your class or hallway today.",
             "easy", "social"),
            ("Ask one question",
             "Raise your hand or approach someone to ask one genuine question.",
             "easy", "class"),
            ("Sit somewhere new",
             "Choose a different seat in class or a different spot in the canteen today.",
             "easy", "social"),
            ("Introduce yourself",
             "Tell one new person your name and ask theirs. That's it — just names.",
             "medium", "social"),
            ("Join a conversation",
             "Find a group chatting about something you know. Listen for 2 minutes, then add one thought.",
             "medium", "social"),
            ("Ask to sit together",
             "Spot someone sitting alone in the canteen. Ask if you can join them.",
             "medium", "canteen"),
            ("Give a compliment",
             "Tell someone something genuine you appreciate about them or their work.",
             "easy", "social"),
            ("Speak first in group",
             "In your next group project meeting, be the first person to say something.",
             "hard", "class"),
            ("Share your opinion",
             "In a class discussion, share your actual opinion on the topic.",
             "hard", "class"),
            ("Start a 2-minute chat",
             "Before or after class, start a conversation with someone nearby.",
             "hard", "social"),
            ("Volunteer an answer",
             "When the teacher asks a question, raise your hand and answer.",
             "medium", "class"),
            ("Write before you speak",
             "Before a group discussion, write down 2 points. Then say at least one.",
             "easy", "class"),
        ]
        conn.executemany('''
            INSERT INTO challenges (title, description, difficulty, category)
            VALUES (?, ?, ?, ?)
        ''', challenges)
        conn.commit()
        print(f"Seeded 12 challenges.")

    conn.close()


def get_todays_challenge(user_id=1):
    conn = get_connection()
    today = datetime.now().strftime('%Y-%m-%d')

    row = conn.execute('''
        SELECT dc.id, dc.completed_at,
               c.title, c.description, c.difficulty, c.category
        FROM daily_challenge dc
        JOIN challenges c ON dc.challenge_id = c.id
        WHERE dc.assigned_date = ? AND dc.user_id = ?
    ''', (today, user_id)).fetchone()

    if row:
        conn.close()
        result = dict(row)
        result['completed'] = result['completed_at'] is not None
        return result

    challenge = conn.execute(
        'SELECT * FROM challenges ORDER BY RANDOM() LIMIT 1'
    ).fetchone()

    if not challenge:
        conn.close()
        return None

    conn.execute('''
        INSERT INTO daily_challenge (challenge_id, assigned_date, user_id)
        VALUES (?, ?, ?)
    ''', (challenge['id'], today, user_id))
    conn.commit()

    row = conn.execute('''
        SELECT dc.id, dc.completed_at,
               c.title, c.description, c.difficulty, c.category
        FROM daily_challenge dc
        JOIN challenges c ON dc.challenge_id = c.id
        WHERE dc.assigned_date = ? AND dc.user_id = ?
    ''', (today, user_id)).fetchone()
    conn.close()

    result = dict(row)
    result['completed'] = False
    return result


def complete_challenge(daily_id, user_id=1):
    conn = get_connection()
    today = datetime.now().strftime('%Y-%m-%d')
    conn.execute('''
        UPDATE daily_challenge SET completed_at = ?
        WHERE id = ? AND user_id = ?
    ''', (today, daily_id, user_id))
    conn.execute('''
        INSERT OR IGNORE INTO streak_log (completed_date, user_id)
        VALUES (?, ?)
    ''', (today, user_id))
    conn.commit()
    conn.close()
    return calculate_streak(user_id)


def calculate_streak(user_id=1):
    conn = get_connection()
    rows = conn.execute('''
        SELECT completed_date FROM streak_log
        WHERE user_id = ?
        ORDER BY completed_date DESC
    ''', (user_id,)).fetchall()
    conn.close()

    if not rows:
        return 0

    from datetime import date, timedelta
    completed_dates = {row['completed_date'] for row in rows}
    streak     = 0
    check_date = date.today()

    while check_date.strftime('%Y-%m-%d') in completed_dates:
        streak    += 1
        check_date -= timedelta(days=1)

    return streak


# ── JOURNAL ───────────────────────────────────────────────

def init_journal():
    conn = get_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            content   TEXT    NOT NULL,
            mood_tag  TEXT    NOT NULL,
            user_id   INTEGER DEFAULT 1,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("Journal table ready.")


def save_journal_entry(content, mood_tag, user_id=1):
    conn = get_connection()
    conn.execute('''
        INSERT INTO journal_entries (content, mood_tag, user_id)
        VALUES (?, ?, ?)
    ''', (content, mood_tag, user_id))
    conn.commit()
    conn.close()


def get_journal_entries(limit=30, user_id=1):
    conn = get_connection()
    cursor = conn.execute('''
        SELECT id, content, mood_tag, timestamp
        FROM journal_entries
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_journal_entry(entry_id, user_id=1):
    conn = get_connection()
    conn.execute('''
        DELETE FROM journal_entries
        WHERE id = ? AND user_id = ?
    ''', (entry_id, user_id))
    conn.commit()
    conn.close()


def get_journal_stats(user_id=1):
    conn = get_connection()
    total = conn.execute(
        'SELECT COUNT(*) FROM journal_entries WHERE user_id = ?',
        (user_id,)
    ).fetchone()[0]
    cursor = conn.execute('''
        SELECT mood_tag, COUNT(*) as count
        FROM journal_entries
        WHERE user_id = ?
        GROUP BY mood_tag
        ORDER BY count DESC
    ''', (user_id,))
    mood_counts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"total": total, "mood_counts": mood_counts}



def get_progress_data(user_id=1):
    """
    Returns all data needed for the progress dashboard:
    - Daily mood scores (average polarity per day)
    - Mood frequency counts
    - Streak history
    - Journal entry counts per day
    - Challenge completion rate
    """
    conn = get_connection()

    # Daily average mood polarity — last 30 days
    mood_trend = conn.execute('''
        SELECT
            date(timestamp) as day,
            AVG(polarity)   as avg_polarity,
            COUNT(*)        as chat_count
        FROM mood_log
        WHERE user_id = ?
        ORDER BY day ASC
        LIMIT 30
    ''', (user_id,)).fetchall()

    # Mood label frequency
    mood_freq = conn.execute('''
        SELECT mood, COUNT(*) as count
        FROM chat_history
        WHERE user_id = ?
        GROUP BY mood
        ORDER BY count DESC
    ''', (user_id,)).fetchall()

    # Journal entries per day
    journal_trend = conn.execute('''
        SELECT
            date(timestamp) as day,
            COUNT(*)        as entry_count
        FROM journal_entries
        WHERE user_id = ?
        GROUP BY day
        ORDER BY day ASC
        LIMIT 30
    ''', (user_id,)).fetchall()

    # Challenges completed
    total_challenges = conn.execute('''
        SELECT COUNT(*) FROM daily_challenge
        WHERE user_id = ?
    ''', (user_id,)).fetchone()[0]

    completed_challenges = conn.execute('''
        SELECT COUNT(*) FROM daily_challenge
        WHERE user_id = ? AND completed_at IS NOT NULL
    ''', (user_id,)).fetchone()[0]

    # Current streak
    streak = calculate_streak(user_id)

    # Overall confidence score (0-100)
    # Based on: avg polarity, streak, challenge completion
    avg_pol = conn.execute('''
        SELECT AVG(polarity) FROM mood_log WHERE user_id = ?
    ''', (user_id,)).fetchone()[0] or 0

    completion_rate = (
        (completed_challenges / total_challenges * 100)
        if total_challenges > 0 else 0
    )

    # Score formula:
    # polarity (-1 to 1) → mapped to 0-50
    # streak (0-30 days) → mapped to 0-25
    # completion rate (0-100%) → mapped to 0-25
    polarity_score    = ((avg_pol + 1) / 2) * 50
    streak_score      = min(streak, 30) / 30 * 25
    completion_score  = completion_rate / 100 * 25
    confidence_score  = round(polarity_score + streak_score + completion_score)

    conn.close()

    return {
        "mood_trend":          [dict(r) for r in mood_trend],
        "mood_freq":           [dict(r) for r in mood_freq],
        "journal_trend":       [dict(r) for r in journal_trend],
        "total_challenges":    total_challenges,
        "completed_challenges": completed_challenges,
        "completion_rate":     round(completion_rate, 1),
        "streak":              streak,
        "confidence_score":    confidence_score,
    }