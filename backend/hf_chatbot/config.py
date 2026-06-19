import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

MODELS = {
    "text": "llama-3.3-70b-versatile",
    "summarize": "llama-3.3-70b-versatile",
    "qa": "llama-3.3-70b-versatile",
    "sentiment": "llama-3.3-70b-versatile"
}

API_URL = "https://api.groq.com/openai/v1/chat/completions"