# auth.py — handles signup/login, now talking to Postgres instead of SQLite.
# The function names are kept the same as your old file on purpose, so
# app.py barely needs to change.

from functools import wraps
from flask import session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from rag.vector_store import get_connection


def init_users():
    """Make sure the users table exists. Safe to call every time the app starts."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id            SERIAL PRIMARY KEY,
                    username      TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at    TIMESTAMPTZ DEFAULT now()
                )
            ''')
        conn.commit()


def register_user(username: str, password: str):
    if not username or not password:
        return False, "Username and password are required."
    if len(password) < 6:
        return False, "Password must be at least 6 characters."

    password_hash = generate_password_hash(password)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                return False, "That username is already taken."

            cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, password_hash),
            )
        conn.commit()

    return True, "Account created successfully."


def login_user(username: str, password: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password_hash FROM users WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()

    if not row:
        return False, "Invalid username or password."

    user_id, db_username, password_hash = row
    if not check_password_hash(password_hash, password):
        return False, "Invalid username or password."

    return True, {"id": user_id, "username": db_username}


def get_current_user():
    if "user_id" not in session:
        return None
    return {"id": session["user_id"], "username": session.get("username")}


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Login required"}), 401
        return f(*args, **kwargs)
    return wrapper