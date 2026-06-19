# 🌟 VibeVerse - AI Companion for Students

An AI-powered student wellness platform that helps students manage emotions, 
build confidence, and discover personalized music and movie recommendations 
through sentiment analysis and an intelligent conversational AI companion.

🔗 **Live Demo:** https://vibe-verse.vercel.app

---

## 📌 Problem Statement

Many students struggle when entering new schools, colleges, or social 
environments. Feelings of anxiety, nervousness, loneliness, and social 
discomfort often make it difficult to interact with others and adapt to 
new surroundings.

VibeVerse acts as a digital companion that understands a student's emotional 
state and provides personalized support through AI-powered chat, mood analysis, 
journaling, challenges, and curated entertainment recommendations.

---

## 🚀 Features

### 🤖 AI-Powered Motivational Chatbot
- Powered by **Llama 3.3 70B** via Groq Inference API
- Detects user sentiment and adapts tone accordingly
- Warm, empathetic, Gen-Z friendly responses
- Maintains conversation memory per session
- Never repeats the same response twice

### 🧠 AI Mood Detection
- Analyzes user messages using sentiment analysis
- Detects emotional state and mood patterns
- Context-aware responses based on situation

### 🎧 Mood-Based Music Recommendations
- Personalized Spotify playlists based on detected mood
- Dynamic recommendations for different emotional situations

### 🎬 Mood-Based Movie Recommendations
- Curated movie suggestions based on current mood
- Integrated with OMDB API for movie details and posters

### 📔 Personal Journal
- Daily journaling system
- Save, manage, and delete journal entries
- Mood tagging for each entry

### 🔥 Daily Challenges
- Confidence-building social challenges
- Designed specifically for students and introverts
- Encourages gradual social growth

### 📈 Streak Tracking
- Daily activity tracking
- Gamified experience to motivate consistent engagement

### 💾 Chat History
- Stores conversations using SQLite
- Allows users to revisit previous interactions

### 🔒 Security Features
- User authentication system
- Input sanitization
- Protection against XSS vulnerabilities
- Parameterized SQL queries

---

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Fetch API
- Deployed on **Vercel**

### Backend
- Python, Flask
- Deployed on **HuggingFace Spaces**

### Database
- SQLite

### AI & NLP
- **Llama 3.3 70B** (via Groq API) — conversational AI
- **TextBlob** — sentiment analysis
- Custom reusable AI module (`hf_chatbot`)

### External APIs
- Groq Inference API
- Spotify Web API
- OMDB API

---

## 🏗️ System Architecture
User Input

│

▼

Frontend (HTML/CSS/JS) — Vercel

│

▼

Flask Backend — HuggingFace Spaces

│

├── Groq AI Chatbot (Llama 3.3 70B)

├── Sentiment Analysis (TextBlob)

├── Music Recommendation Engine

├── Movie Recommendation Engine

├── Journal Management

├── Challenge System

└── Streak Tracking

│

▼

SQLite Database

│

▼

Personalized Response

---

## 🎯 Target Audience
- School & College Students
- Introverts and socially anxious individuals
- Students seeking emotional support and self-improvement

---

## 📚 What I Learned
- Full Stack Web Development
- Flask Backend Development & REST APIs
- LLM Integration (Groq + Llama 3.3)
- Building reusable AI modules in Python
- HuggingFace Spaces deployment
- Database Design with SQLite
- Sentiment Analysis & NLP
- Authentication & Secure Coding Practices
- Debugging real-world deployment issues

---

## 🔮 Future Improvements
- Per-user persistent chat memory
- Mobile Application (Android & iOS)
- Real-Time Chat Support
- Advanced Analytics Dashboard
- Community Support Groups
- Voice-based emotional support

---

## 👩‍💻 Author

**Heena Jindal**
B.Tech Student | AI/ML Enthusiast | Full Stack Developer

GitHub: https://github.com/heena-jindal

---

⭐ If you found this project interesting, consider giving it a star!
