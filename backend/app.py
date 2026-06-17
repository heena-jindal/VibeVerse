from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import sys
import os
import requests as http_requests
from textblob import TextBlob
from datetime import timedelta

sys.path.insert(0, os.path.dirname(__file__))

from mood_detector import detect_mood
from suggestions   import get_suggestion
from database      import (init_db, save_chat, save_mood,
                           get_recent_chats, get_mood_counts,
                           init_challenges, get_todays_challenge,
                           complete_challenge, calculate_streak,
                           init_journal, save_journal_entry,
                           get_journal_entries, delete_journal_entry,
                           get_journal_stats, add_user_id_columns,
                           get_progress_data, get_connection)
from auth import (init_users, register_user,
                  login_user, get_current_user, login_required)

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://vibe-verse.vercel.app", "http://localhost:3000"])

IS_PROD = os.environ.get('IS_PRODUCTION', 'false').lower() == 'true'

app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')

app.config['SESSION_COOKIE_SAMESITE']    = 'None' if IS_PROD else 'Lax'
app.config['SESSION_COOKIE_SECURE']      = IS_PROD
app.config['SESSION_COOKIE_HTTPONLY']    = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

CORS(app,
     origins=[FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
     supports_credentials=True)

init_db()
init_users()
add_user_id_columns()
init_challenges()
init_journal()


# ── PUBLIC ROUTES ────────────────────────────────────────

@app.route('/')
def index():
    user = get_current_user()
    return render_template('index.html', user=user)





# ── AUTH API ROUTES ──────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def api_register():
    data     = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    success, message = register_user(username, password)
    return jsonify({"success": success, "message": message})

@app.route('/api/login', methods=['POST'])
def api_login():
    data     = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    success, result = login_user(username, password)

    if success:
        session['user_id']  = result['id']
        session['username'] = result['username']
        session.permanent   = True    # ← add this line
        return jsonify({
            "success": True,
            "message": f"Welcome back, {result['username']}!"
        })
    return jsonify({"success": False, "message": result})

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()   # same as your old college project
    return jsonify({"success": True})


# ── PROTECTED PAGE ROUTES ────────────────────────────────




# ── PROTECTED API ROUTES ─────────────────────────────────

@app.route('/api/chat', methods=['POST'])
@login_required
def handle_chat():
    user         = get_current_user()
    data         = request.get_json()
    user_message = data.get('message', '')
    situation    = data.get('situation', 'in_class')

    # Step 1: Detect mood using TextBlob (keep this — it's fast and free)
    mood     = detect_mood(user_message)
    polarity = TextBlob(user_message).sentiment.polarity

    # Step 2: Try Gemini first for human-like response
    reply = None
    
    if os.environ.get('GEMINI_API_KEY'):
        try:
            from chatbot import get_gemini_response
            reply = get_gemini_response(user_message, situation, mood)
        except Exception as e:
            print(f"Gemini error: {e}")
            reply = None

    # Step 3: Fall back to suggestion engine if Gemini fails/unavailable
    if not reply:
        suggestion = get_suggestion(mood, situation)
        reply = (
            f"I can sense you're feeling {mood} right now. "
            f"That's completely okay. {suggestion}"
        )

    # Step 4: Save to database
    save_chat(user_message, mood, situation, reply, user_id=user['id'])
    save_mood(mood, polarity, user_id=user['id'])

    return jsonify({
        "mood":    mood,
        "reply":   reply,
        "suggestion": reply
    })

@app.route('/api/history', methods=['GET'])
@login_required
def api_history():
    user   = get_current_user()
    chats  = get_recent_chats(limit=20, user_id=user['id'])
    counts = get_mood_counts(user_id=user['id'])
    return jsonify({"chats": chats, "counts": counts})

@app.route('/api/challenge/today', methods=['GET'])
@login_required
def api_today_challenge():
    user      = get_current_user()
    challenge = get_todays_challenge(user_id=user['id'])
    streak    = calculate_streak(user_id=user['id'])
    return jsonify({"challenge": challenge, "streak": streak})

@app.route('/api/challenge/complete', methods=['POST'])
@login_required
def api_complete_challenge():
    user       = get_current_user()
    data       = request.get_json()
    daily_id   = data.get('daily_id')
    new_streak = complete_challenge(daily_id, user_id=user['id'])
    return jsonify({"success": True, "streak": new_streak})

@app.route('/api/journal', methods=['GET'])
@login_required
def api_get_journal():
    user    = get_current_user()
    entries = get_journal_entries(limit=30, user_id=user['id'])
    stats   = get_journal_stats(user_id=user['id'])
    return jsonify({"entries": entries, "stats": stats})

@app.route('/api/journal', methods=['POST'])
@login_required
def api_save_journal():
    user     = get_current_user()
    data     = request.get_json()
    content  = data.get('content', '').strip()
    mood_tag = data.get('mood_tag', 'reflective')

    if not content:
        return jsonify({"error": "Entry cannot be empty"}), 400
    if len(content) > 2000:
        return jsonify({"error": "Entry too long"}), 400

    save_journal_entry(content, mood_tag, user_id=user['id'])
    return jsonify({"success": True})

@app.route('/api/journal/<int:entry_id>', methods=['DELETE'])
@login_required
def api_delete_journal(entry_id):
    user = get_current_user()
    delete_journal_entry(entry_id, user_id=user['id'])
    return jsonify({"success": True})

# ── ROUTE: Progress page ─────────────────────────────────
@app.route('/progress')
@login_required
def progress_page():
    user = get_current_user()
    return render_template('progress.html', user=user)


# ── API: Progress data ───────────────────────────────────
@app.route("/api/progress", methods=["GET"])
def progress():
    return {
        "confidence_score": 72,
        "streak": 5,
        "completion_rate": 60,
        "mood_trend": [],
        "mood_freq": [],
        "journal_trend": [],
        "completed_challenges": 3,
        "total_challenges": 10
    }




# ── API: Music recommendation ────────────────────────────
@app.route('/api/music', methods=['GET'])
@login_required
def api_music():
    """
    Returns a Spotify playlist embed ID based on current mood.
    Mood is read from the user's most recent chat entry.
    """
    user = get_current_user()
    conn = get_connection()

    # Get user's most recent mood
    recent = conn.execute('''
        SELECT mood FROM chat_history
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (user['id'],)).fetchone()
    conn.close()

    mood = recent['mood'] if recent else 'okay'

    # Map mood to Spotify playlist IDs
    # Replace these with your own playlist IDs from Spotify
    # To get a playlist ID: open playlist in Spotify
    # → Share → Copy link → ID is after /playlist/
    playlist_map = {
        'very anxious': {
            'name':        'Deep Calm',
            'description': 'Gentle sounds to ease your anxiety',
            'playlist_id': '37i9dQZF1DX3Ogo9pFvBkY',  # Peaceful Piano
            'color':       '#E1F5EE'
        },
        'nervous': {
            'name':        'Soothing Vibes',
            'description': 'Calming music to settle your nerves',
            'playlist_id': '37i9dQZF1DWZqd5JICZI0u',  # Calm Vibes
            'color':       '#EEEDFE'
        },
        'confused': {
            'name':        'Clear Your Head',
            'description': 'Focus music to help you think clearly',
            'playlist_id': '37i9dQZF1DWZeKCadgRdKQ',  # Deep Focus
            'color':       '#E6F1FB'
        },
        'okay': {
            'name':        'Feel Good Mix',
            'description': 'Uplifting tunes for a good day',
            'playlist_id': '37i9dQZF1DX3rxVfibe1L0',  # Mood Booster
            'color':       '#FAEEDA'
        },
        'confident': {
            'name':        'Power Up',
            'description': 'High energy music to match your mood',
            'playlist_id': '37i9dQZF1DWUa8ZRTfalHk',  # Power Hour
            'color':       '#EAF3DE'
        }
    }

    playlist = playlist_map.get(mood, playlist_map['okay'])
    playlist['mood'] = mood

    return jsonify(playlist)


# Curated movie titles per mood — content-based recommendation
# Add/remove titles anytime to customize recommendations
MOOD_MOVIES = {
    'very anxious': {
        'label': 'Light comedies to lift your spirits',
        'titles': ['The Intern', 'Paddington', 'School of Rock',
                   'Mrs. Doubtfire', 'Ferris Bueller\'s Day Off',
                   'The Princess Bride', 'Up', 'Zootopia']
    },
    'nervous': {
        'label': 'Heartwarming stories for comfort',
        'titles': ['Forrest Gump', 'The Pursuit of Happyness',
                   'Inside Out', 'Coco', 'Soul',
                   'Good Will Hunting', 'Little Miss Sunshine', 'Luca']
    },
    'confused': {
        'label': 'Inspiring stories to broaden your mind',
        'titles': ['The Social Network', 'A Beautiful Mind',
                   'Hidden Figures', 'The Imitation Game',
                   'October Sky', 'Dead Poets Society',
                   'Good Will Hunting', 'Free Solo']
    },
    'okay': {
        'label': 'Feel-good movies for a good time',
        'titles': ['Spider-Man: Into the Spider-Verse', 'The Grand Budapest Hotel',
                   'Sing Street', 'La La Land', 'Game Night',
                   'Crazy Rich Asians', 'Knives Out', 'Paddington 2']
    },
    'confident': {
        'label': 'Adventure films to match your energy',
        'titles': ['The Avengers', 'Mad Max: Fury Road', 'Top Gun: Maverick',
                   'Spider-Man: No Way Home', 'Guardians of the Galaxy',
                   'Mission: Impossible - Fallout', 'Everything Everywhere All at Once',
                   'Dune']
    },
}


@app.route('/api/movies', methods=['GET'])
@login_required
def api_movies():
    OMDB_API_KEY = os.environ.get('OMDB_API_KEY', 'YOUR_OMDB_API_KEY')

    user = get_current_user()

    mood = request.args.get('mood')
    if not mood:
        conn = get_connection()
        recent = conn.execute('''
            SELECT mood FROM chat_history
            WHERE user_id = ?
            ORDER BY timestamp DESC LIMIT 1
        ''', (user['id'],)).fetchone()
        conn.close()
        mood = recent['mood'] if recent else 'okay'

    mood_data = MOOD_MOVIES.get(mood, MOOD_MOVIES['okay'])
    titles = mood_data['titles']

    clean_movies = []
    for title in titles:
        try:
            response = http_requests.get(
                'http://www.omdbapi.com/',
                params={'apikey': OMDB_API_KEY, 't': title, 'type': 'movie'},
                timeout=5
            )
            data = response.json()

            if data.get('Response') == 'True':
                poster = data.get('Poster')
                clean_movies.append({
                    'id':       data.get('imdbID'),
                    'title':    data.get('Title'),
                    'overview': data.get('Plot', '')[:150] +
                                ('...' if len(data.get('Plot', '')) > 150 else ''),
                    'rating':   data.get('imdbRating', 'N/A'),
                    'poster':   poster if poster and poster != 'N/A' else None,
                    'year':     data.get('Year'),
                    'tmdb_url': f"https://www.imdb.com/title/{data.get('imdbID')}/"
                })
        except Exception:
            continue

    return jsonify({
        'mood':   mood,
        'label':  mood_data['label'],
        'movies': clean_movies
    })


@app.route('/api/login/check', methods=['GET'])
def api_login_check():
    """Check if user is currently logged in."""
    user = get_current_user()
    if user:
        return jsonify({"username": user['username'], "id": user['id']})
    return jsonify({"username": None}), 401



if __name__ == '__main__':
    app.run(debug=True, port=5000)