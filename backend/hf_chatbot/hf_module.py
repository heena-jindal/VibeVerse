import requests
import json
import os
from config import GROQ_API_KEY, MODELS, API_URL

HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

MEMORY_DIR = "memory"

def get_memory_path(session_id):
    return os.path.join(MEMORY_DIR, f"memory_{session_id}.json")

def load_memory(session_id):
    os.makedirs(MEMORY_DIR, exist_ok=True)
    path = get_memory_path(session_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []

def save_memory(session_id, history):
    path = get_memory_path(session_id)
    with open(path, "w") as f:
        json.dump(history, f, indent=2)

def clear_memory(session_id):
    path = get_memory_path(session_id)
    if os.path.exists(path):
        os.remove(path)
        print(f"Memory cleared for session: {session_id}")
    else:
        print(f"No memory found for session: {session_id}")

def query(task, system_prompt, user_prompt, session_id=None):
    history = load_memory(session_id) if session_id else []
    
    messages = [{"role": "system", "content": system_prompt}]
    messages += history
    messages.append({"role": "user", "content": user_prompt})
    
    payload = {
        "model": MODELS[task],
        "messages": messages
    }
    
    response = requests.post(API_URL, headers=HEADERS, json=payload)
    result = response.json()
    
    if "choices" in result:
        reply = result["choices"][0]["message"]["content"]
        if session_id:
            history.append({"role": "user", "content": user_prompt})
            history.append({"role": "assistant", "content": reply})
            save_memory(session_id, history)
        return reply
    else:
        return f"Error: {result}"

def generate_text(prompt, session_id=None):
    return query("text", "You are a helpful assistant.", prompt, session_id)

def summarize(text, session_id=None):
    return query("summarize", "Summarize the given text briefly.", text, session_id)

def answer_question(context, question, session_id=None):
    return query("qa", "Answer the question based on the context given.", f"Context: {context}\nQuestion: {question}", session_id)

def analyze_sentiment(text, session_id=None):
    return query("sentiment", "Analyze sentiment. Reply with only one word: positive, negative, or neutral.", text, session_id)

def motivational_chat(user_message, session_id="vibeverse"):
    sentiment = analyze_sentiment(user_message)
    
    if sentiment == "negative":
        system = "You are a warm, empathetic and motivating friend. The user seems sad or stressed. Be extra supportive and encouraging."
    elif sentiment == "positive":
        system = "You are an enthusiastic and energetic friend. The user is in a good mood. Match their energy and keep them motivated."
    else:
        system = "You are a friendly and supportive companion. Be warm and engaging."
    
    return query("text", system, user_message, session_id)