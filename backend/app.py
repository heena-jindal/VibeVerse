from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from datetime import timedelta

from rag.vector_store import (
    save_journal_entry, get_journal_entries, delete_journal_entry,
    get_journal_stats, get_recent_chats, get_mood_counts, get_latest_mood,
)
from database import (
    init_challenges, get_todays_challenge, complete_challenge,
    calculate_streak, get_progress_data,
)
from auth import init_users, register_user, login_user, get_current_user, login_required
from flask import session

app = Flask(__name__)

def _rate_limit_key():
    user_id = session.get('user_id')
    return f"user:{user_id}" if user_id is not None else get_remote_address()

limiter = Limiter(key_func=_rate_limit_key, app=app, default_limits=[])

IS_PROD = os.environ.get('IS_PRODUCTION', 'false').lower() == 'true'
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')

app.config['SESSION_COOKIE_SAMESITE'] = 'None' if IS_PROD else 'Lax'
app.config['SESSION_COOKIE_SECURE'] = IS_PROD
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
CORS(app, origins=[FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
     supports_credentials=True)

# Set up tables that need to exist on startup (safe to call every time —
# each one only creates what's missing)
init_users()
init_challenges()


# ── PUBLIC ROUTES ────────────────────────────────────────

@app.route('/')
def index():
    user = get_current_user()
    return render_template('index.html', user=user)


# ── AUTH API ROUTES ──────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    success, message = register_user(username, password)
    return jsonify({"success": success, "message": message})


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    success, result = login_user(username, password)

    if success:
        session['user_id'] = result['id']
        session['username'] = result['username']
        session.permanent = True
        return jsonify({"success": True, "message": f"Welcome back, {result['username']}!"})
    return jsonify({"success": False, "message": result})


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"success": True})


@app.route('/api/login/check', methods=['GET'])
def api_login_check():
    user = get_current_user()
    if user:
        return jsonify({"username": user['username'], "id": user['id']})
    return jsonify({"username": None}), 401


# ── CHAT (now using Groq + memory, instead of hf_chatbot) ────────────────

@app.route('/api/chat', methods=['POST'])
@limiter.limit("20 per minute")
@login_required
def handle_chat():
    # Chat dependencies are large; don't load them while serving auth routes.
    from rag.graph import chat_graph

    user = get_current_user()
    data = request.get_json()
    user_message = data.get('message', '')
    situation = data.get('situation', 'in_class')

    result = chat_graph.invoke({
        "user_id": user['id'],
        "message": user_message,
        "situation": situation,
        "crisis_flag": False,
        "memories": [],
        "recent_turns": [],
        "reply": "",
        "mood_label": "",
    })

    return jsonify({
        "reply": result["reply"],
        "mood": result["mood_label"],
    })


@app.errorhandler(429)
def handle_rate_limit_error(_error):
    return jsonify({"error": "Too many messages, please slow down."}), 429


@app.route('/api/history', methods=['GET'])
@login_required
def api_history():
    user = get_current_user()
    chats = get_recent_chats(user_id=user['id'], limit=20)
    counts = get_mood_counts(user_id=user['id'])
    return jsonify({"chats": chats, "counts": counts})


# ── CHALLENGES ────────────────────────────────────────────

@app.route('/api/challenge/today', methods=['GET'])
@login_required
def api_today_challenge():
    user = get_current_user()
    challenge = get_todays_challenge(user_id=user['id'])
    streak = calculate_streak(user_id=user['id'])
    return jsonify({"challenge": challenge, "streak": streak})


@app.route('/api/challenge/complete', methods=['POST'])
@login_required
def api_complete_challenge():
    user = get_current_user()
    data = request.get_json()
    daily_id = data.get('daily_id')
    new_streak = complete_challenge(daily_id, user_id=user['id'])
    return jsonify({"success": True, "streak": new_streak})


# ── JOURNAL ───────────────────────────────────────────────

@app.route('/api/journal', methods=['GET'])
@login_required
def api_get_journal():
    user = get_current_user()
    entries = get_journal_entries(user_id=user['id'], limit=30)
    for e in entries:
        e['mood_tag'] = e['mood_label']
        e['timestamp'] = e['created_at'].isoformat()
    stats = get_journal_stats(user_id=user['id'])
    for m in stats['mood_counts']:
        m['mood_tag'] = m['mood_label']
    return jsonify({"entries": entries, "stats": stats})


@app.route('/api/journal', methods=['POST'])
@login_required
def api_save_journal():
    user = get_current_user()
    data = request.get_json()
    content = data.get('content', '').strip()
    mood_tag = data.get('mood_tag', 'reflective')

    if not content:
        return jsonify({"error": "Entry cannot be empty"}), 400
    if len(content) > 2000:
        return jsonify({"error": "Entry too long"}), 400

    save_journal_entry(user_id=user['id'], content=content, mood_label=mood_tag)
    return jsonify({"success": True})


@app.route('/api/journal/<int:entry_id>', methods=['DELETE'])
@login_required
def api_delete_journal(entry_id):
    user = get_current_user()
    delete_journal_entry(entry_id, user_id=user['id'])
    return jsonify({"success": True})


# ── PROGRESS ──────────────────────────────────────────────

@app.route('/api/progress', methods=['GET'])
@login_required
def api_progress():
    user = get_current_user()
    data = get_progress_data(user_id=user['id'])
    data['mood_trend'] = []
    data['journal_trend'] = []
    return jsonify(data)


# ── MUSIC (now reads mood from the new chat memory, not SQLite) ─────────

PLAYLIST_MAP = {
    'very anxious': {'name': 'Deep Calm', 'description': 'Gentle sounds to ease your anxiety',
                      'playlist_id': '37i9dQZF1DX3Ogo9pFvBkY', 'color': '#E1F5EE'},
    'nervous': {'name': 'Soothing Vibes', 'description': 'Calming music to settle your nerves',
                'playlist_id': '37i9dQZF1DWZqd5JICZI0u', 'color': '#EEEDFE'},
    'confused': {'name': 'Clear Your Head', 'description': 'Focus music to help you think clearly',
                 'playlist_id': '37i9dQZF1DWZeKCadgRdKQ', 'color': '#E6F1FB'},
    'okay': {'name': 'Feel Good Mix', 'description': 'Uplifting tunes for a good day',
             'playlist_id': '37i9dQZF1DX3rxVfibe1L0', 'color': '#FAEEDA'},
    'confident': {'name': 'Power Up', 'description': 'High energy music to match your mood',
                  'playlist_id': '37i9dQZF1DWUa8ZRTfalHk', 'color': '#EAF3DE'},
    'sad': {'name': 'Gentle Comfort', 'description': 'Soft, soothing music for heavy days',
                   'playlist_id': '37i9dQZF1DX3Ogo9pFvBkY', 'color': '#E1F5EE'},
}



@app.route('/api/music', methods=['GET'])
@login_required
def api_music():
    user = get_current_user()
    mood = get_latest_mood(user_id=user['id']) or 'okay'
    playlist = dict(PLAYLIST_MAP.get(mood, PLAYLIST_MAP['okay']))
    playlist['mood'] = mood
    return jsonify(playlist)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
