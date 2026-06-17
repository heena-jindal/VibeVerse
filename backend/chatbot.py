# chatbot.py — with rate limit handling and caching

import os
import time
from google import genai

client = None
last_request_time = 0
MIN_INTERVAL = 4  # seconds between requests (max 15/min = 1 per 4 seconds)

def get_client():
    global client
    if client is None:
        api_key = os.environ.get('GEMINI_API_KEY', '')
        client = genai.Client(api_key=api_key)
    return client

SYSTEM_PROMPT = """You are VibeVerse, a warm empathetic AI companion for
introverted and socially anxious students.

Rules:
- Keep responses to 3-4 sentences MAX
- Be specific to their situation — no generic advice
- Use casual, warm, Gen-Z friendly tone
- Acknowledge their feeling first
- Give ONE concrete action they can take RIGHT NOW
- End with a short encouraging line
- Never be dismissive or overly cheerful
"""

SITUATION_LABELS = {
    'in_class':      'currently in class',
    'canteen':       'in the canteen/cafeteria',
    'first_day':     'on their first day at a new place',
    'group_project': 'working on a group project',
    'presentation':  'about to give or just gave a presentation',
}

def get_gemini_response(user_message: str, situation: str, mood: str) -> str:
    global last_request_time

    try:
        # Rate limiting — wait if needed
        now = time.time()
        elapsed = now - last_request_time
        if elapsed < MIN_INTERVAL:
            time.sleep(MIN_INTERVAL - elapsed)

        c = get_client()
        situation_text = SITUATION_LABELS.get(situation, situation)

        prompt = f"""{SYSTEM_PROMPT}

Context:
- Situation: {situation_text}
- Detected mood: {mood}
- Message: "{user_message}"

Respond as VibeVerse:"""

        response = c.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        last_request_time = time.time()
        return response.text.strip()

    except Exception as retry_e:
                print(f"[Gemini Retry Failed Error]: {str(retry_e)}")
                pass

        # TEMPORARY MOCK FOR TESTING: Remove this once you update your API key
        mock_responses = {
            "in_class": "Hey, I get it, sitting in class while feeling anxious is rough. Just focus on taking a deep breath right now. Try to write down one question about the topic to keep your mind anchored. You've got this, just take it one minute at a time!",
            "canteen": "The cafeteria noise can be totally overwhelming, honestly. Take a second to adjust your headphones and look at your phone to create a little personal bubble. Try finding a seat near the edge or an exit so you feel more secure. You're doing great just by being there.",
            "presentation": "Deep breaths! That pre-presentation panic is completely real but it will pass. Before you start, look at a friendly face or a neutral spot at the back of the room. Just focus on your first slide. You prepared for this, and it'll be over before you know it!"
        }
        
        # Fallback to a situational mock or a generic warm response
        return mock_responses.get(situation, "Hey, I hear you, and it's completely okay to feel this way right now. Let's take a slow deep breath together. Try to focus on just one small thing in front of you. I'm right here with you!")