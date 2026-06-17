# auth.py
# Adapted from your Smart College Assistant project.
# Changed: roll_number → username, removed face recognition,
# simplified register, kept sha256 hashing like your old project.

import hashlib
from functools import wraps
from flask import session, redirect, url_for, request
from database import get_connection
from flask import session, redirect, url_for, request, jsonify


def _hash(password):
    """
    Exactly the same hash function from your old project.
    sha256 converts password into a fixed-length string.
    """
    return hashlib.sha256(password.encode()).hexdigest()


def init_users():
    """Creates users table. Same pattern as your old init_db()."""
    conn = get_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("Users table ready.")


def register_user(username, password):
    """
    Adapted from your /auth/register route.
    Removed: face image, roll_number, department, role.
    Kept: duplicate check, hashing, same error style.
    """
    if not username or not password:
        return False, "Username and password are required."

    if len(username) < 3:
        return False, "Username must be at least 3 characters."

    if len(password) < 6:
        return False, "Password must be at least 6 characters."

    # Check duplicate — same as your old project
    conn = get_connection()
    existing = conn.execute(
        'SELECT id FROM users WHERE username = ?', (username,)
    ).fetchone()

    if existing:
        conn.close()
        return False, "Username already taken. Please choose another."

    # Hash exactly like your old _hash() function
    conn.execute(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        (username, _hash(password))
    )
    conn.commit()
    conn.close()
    return True, "Account created successfully! Please log in."


def login_user(username, password):
    """
    Adapted from your /auth/login route.
    Changed roll_number → username, kept same hash check pattern.
    """
    if not username or not password:
        return False, "Please enter both username and password."

    conn = get_connection()

    # Same pattern as your old login —
    # find user where username AND hash both match
    user = conn.execute(
        'SELECT id, username FROM users WHERE username = ? AND password_hash = ?',
        (username, _hash(password))
    ).fetchone()
    conn.close()

    if not user:
        # Same vague message as your old project for security
        return False, "Incorrect username or password."

    return True, {"id": user['id'], "username": user['username']}


def get_current_user():
    """
    Adapted from your current_user() helper.
    Same logic — reads user_id from session, fetches from DB.
    """
    uid = session.get('user_id')
    if not uid:
        return None

    conn = get_connection()
    user = conn.execute(
        'SELECT id, username FROM users WHERE id = ?', (uid,)
    ).fetchone()
    conn.close()

    return dict(user) if user else None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({
                "error": "Not authenticated",
                "debug_session": dict(session),
                "debug_cookies": dict(request.cookies),
                "debug_path": request.path
            }), 401
        return f(*args, **kwargs)
    return decorated
