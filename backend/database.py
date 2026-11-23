# database.py — challenges, streaks, and the progress page.
# Journal and chat now live in rag/vector_store.py instead (they need
# the embedding/vector logic, so it made sense to keep them together there).

from datetime import date, timedelta
from psycopg2.extras import RealDictCursor

from rag.vector_store import get_connection, get_mood_counts

# How much each mood "scores" out of 100 — used for the confidence score
# on the Progress page, replacing the old TextBlob polarity number.
MOOD_SCORES = {
    "very anxious": 10,
    "nervous": 30,
    "confused": 45,
    "okay": 65,
    "content": 75,
    "confident": 90,
    "hopeful": 80,
}
DEFAULT_MOOD_SCORE = 50


def init_challenges():
    """Create the challenges tables and seed them with the starter list,
    if they're empty. Safe to call every time the app starts."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                CREATE TABLE IF NOT EXISTS challenges (
                    id          SERIAL PRIMARY KEY,
                    title       TEXT NOT NULL,
                    description TEXT NOT NULL,
                    difficulty  TEXT NOT NULL,
                    category    TEXT NOT NULL
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS daily_challenge (
                    id            SERIAL PRIMARY KEY,
                    challenge_id  INTEGER REFERENCES challenges(id),
                    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    assigned_date DATE DEFAULT CURRENT_DATE,
                    completed_at  DATE
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS streak_log (
                    id             SERIAL PRIMARY KEY,
                    user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    completed_date DATE NOT NULL,
                    UNIQUE(completed_date, user_id)
                )
            ''')
            conn.commit()

            cur.execute("SELECT COUNT(*) FROM challenges")
            count = cur.fetchone()[0]

            if count == 0:
                challenges = [
                    ("Smile at one person", "Make eye contact and smile at one person in your class or hallway today.", "easy", "social"),
                    ("Ask one question", "Raise your hand or approach someone to ask one genuine question.", "easy", "class"),
                    ("Sit somewhere new", "Choose a different seat in class or a different spot in the canteen today.", "easy", "social"),
                    ("Introduce yourself", "Tell one new person your name and ask theirs. That's it — just names.", "medium", "social"),
                    ("Join a conversation", "Find a group chatting about something you know. Listen for 2 minutes, then add one thought.", "medium", "social"),
                    ("Ask to sit together", "Spot someone sitting alone in the canteen. Ask if you can join them.", "medium", "canteen"),
                    ("Give a compliment", "Tell someone something genuine you appreciate about them or their work.", "easy", "social"),
                    ("Speak first in group", "In your next group project meeting, be the first person to say something.", "hard", "class"),
                    ("Share your opinion", "In a class discussion, share your actual opinion on the topic.", "hard", "class"),
                    ("Start a 2-minute chat", "Before or after class, start a conversation with someone nearby.", "hard", "social"),
                    ("Volunteer an answer", "When the teacher asks a question, raise your hand and answer.", "medium", "class"),
                    ("Write before you speak", "Before a group discussion, write down 2 points. Then say at least one.", "easy", "class"),
                ]
                cur.executemany(
                    "INSERT INTO challenges (title, description, difficulty, category) VALUES (%s, %s, %s, %s)",
                    challenges,
                )
                conn.commit()


def get_todays_challenge(user_id: int) -> dict | None:
    today = date.today()
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT dc.id, dc.completed_at, c.title, c.description, c.difficulty, c.category
                FROM daily_challenge dc
                JOIN challenges c ON dc.challenge_id = c.id
                WHERE dc.assigned_date = %s AND dc.user_id = %s
                """,
                (today, user_id),
            )
            row = cur.fetchone()
            if row:
                row["completed"] = row["completed_at"] is not None
                return row

            cur.execute("SELECT id FROM challenges ORDER BY RANDOM() LIMIT 1")
            challenge = cur.fetchone()
            if not challenge:
                return None

            cur.execute(
                "INSERT INTO daily_challenge (challenge_id, assigned_date, user_id) VALUES (%s, %s, %s)",
                (challenge["id"], today, user_id),
            )
            conn.commit()

            cur.execute(
                """
                SELECT dc.id, dc.completed_at, c.title, c.description, c.difficulty, c.category
                FROM daily_challenge dc
                JOIN challenges c ON dc.challenge_id = c.id
                WHERE dc.assigned_date = %s AND dc.user_id = %s
                """,
                (today, user_id),
            )
            row = cur.fetchone()
            row["completed"] = False
            return row


def complete_challenge(daily_id: int, user_id: int) -> int:
    today = date.today()
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE daily_challenge SET completed_at = %s WHERE id = %s AND user_id = %s",
                (today, daily_id, user_id),
            )
            cur.execute(
                "INSERT INTO streak_log (completed_date, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (today, user_id),
            )
        conn.commit()
    return calculate_streak(user_id)


def calculate_streak(user_id: int) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT completed_date FROM streak_log WHERE user_id = %s ORDER BY completed_date DESC",
                (user_id,),
            )
            rows = cur.fetchall()

    if not rows:
        return 0

    completed_dates = {row[0] for row in rows}
    streak = 0
    check_date = date.today()
    while check_date in completed_dates:
        streak += 1
        check_date -= timedelta(days=1)
    return streak


def get_progress_data(user_id: int) -> dict:
    """Builds the stats for the Progress page. Mood data now comes from
    rag/vector_store.py (chat_messages table) instead of the old mood_log."""
    mood_counts = get_mood_counts(user_id)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM daily_challenge WHERE user_id = %s", (user_id,))
            total_challenges = cur.fetchone()[0]

            cur.execute(
                "SELECT COUNT(*) FROM daily_challenge WHERE user_id = %s AND completed_at IS NOT NULL",
                (user_id,),
            )
            completed_challenges = cur.fetchone()[0]

    streak = calculate_streak(user_id)
    completion_rate = (completed_challenges / total_challenges * 100) if total_challenges > 0 else 0

    # Average mood score, using the MOOD_SCORES map above instead of TextBlob polarity
    if mood_counts:
        weighted_total = sum(MOOD_SCORES.get(m["mood"], DEFAULT_MOOD_SCORE) * m["count"] for m in mood_counts)
        total_count = sum(m["count"] for m in mood_counts)
        avg_mood_score = weighted_total / total_count
    else:
        avg_mood_score = DEFAULT_MOOD_SCORE

    mood_score_component = (avg_mood_score / 100) * 50
    streak_score = min(streak, 30) / 30 * 25
    completion_score = completion_rate / 100 * 25
    confidence_score = round(mood_score_component + streak_score + completion_score)

    return {
        "mood_freq": mood_counts,
        "total_challenges": total_challenges,
        "completed_challenges": completed_challenges,
        "completion_rate": round(completion_rate, 1),
        "streak": streak,
        "confidence_score": confidence_score,
    }