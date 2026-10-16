"""
Flow:
    classify_intent -> crisis? -> safe_response -> END
                          |
                          no
                          |
    retrieve (old memories + last few messages) -> generate_reply -> persist -> END
"""

import os
from typing import TypedDict

from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END

from rag.retriever import retrieve_memories, format_memories_for_prompt
from rag.vector_store import save_chat_message, get_recent_messages
from rag.schemas import ChatResponse, IntentCheck

GROQ_MODEL = "openai/gpt-oss-120b"

CRISIS_SAFE_RESPONSE = (
    "It sounds like you're going through something really heavy right now, and "
    "I want to make sure you get support beyond what I can offer as a chatbot. "
    "In India, you can call the Tele-MANAS mental health helpline at 14416 or "
    "1800-89-14416 for free, 24/7 support. Please also reach out to a trusted "
    "adult or counselor right away. You don't have to go through this alone."
)

SITUATION_LABELS = {
    "in_class": "currently in class",
    "canteen": "in the canteen/cafeteria",
    "first_day": "on their first day at a new place",
    "group_project": "working on a group project",
    "presentation": "about to give or just gave a presentation",
}

ALLOWED_MOODS = ["very anxious", "nervous", "confused", "sad", "okay", "confident"]

MOOD_SYNONYMS = {
    "anxious": "very anxious", "panicked": "very anxious", "overwhelmed": "very anxious",
    "stressed": "nervous", "worried": "nervous", "awkward": "nervous", "scared": "nervous",
    "tired": "sad", "exhausted": "sad", "lonely": "sad", "down": "sad",
    "calm": "okay", "content": "okay", "fine": "okay", "reflective": "okay",
    "happy": "confident", "proud": "confident", "hopeful": "confident", "excited": "confident",
    "unsure": "confused",
}


def _normalize_mood(raw: str) -> str:
    """Whatever mood word the AI picks, map it onto one of our six moods."""
    mood = (raw or "").strip().lower()
    if mood in ALLOWED_MOODS:
        return mood
    return MOOD_SYNONYMS.get(mood, "okay")


class GraphState(TypedDict):
    user_id: int
    message: str
    situation: str
    crisis_flag: bool
    memories: list[dict]
    recent_turns: list[dict]
    reply: str
    mood_label: str


def _llm(structured_schema=None):
    model = ChatGroq(model=GROQ_MODEL, api_key=os.environ["GROQ_API_KEY"])
    if structured_schema:
        return model.with_structured_output(structured_schema)
    return model


def _format_recent_turns(turns: list[dict]) -> str:
    if not turns:
        return "(this is the start of the conversation)"
    lines = []
    for t in turns:
        who = "Student" if t["role"] == "user" else "VibeVerse"
        lines.append(f"{who}: {t['content']}")
    return "\n".join(lines)


# ---------- Steps ----------

def classify_intent(state: GraphState) -> GraphState:
    llm = _llm(IntentCheck)
    result: IntentCheck = llm.invoke(
        f"Assess this message for crisis-level distress (self-harm, suicidal "
        f"ideation, acute danger). Message: \"{state['message']}\""
    )
    state["crisis_flag"] = result.crisis_flag
    return state


def safe_response(state: GraphState) -> GraphState:
    state["reply"] = CRISIS_SAFE_RESPONSE
    state["mood_label"] = "very anxious"
    return state


def retrieve(state: GraphState) -> GraphState:
    state["memories"] = retrieve_memories(
        user_id=state["user_id"],
        query_text=state["message"],
        sources=("journal", "chat"),
        top_k=5,
    )
    state["recent_turns"] = get_recent_messages(state["user_id"], limit=6)
    return state


def generate_reply(state: GraphState) -> GraphState:
    memory_block = format_memories_for_prompt(state["memories"])
    recent_block = _format_recent_turns(state["recent_turns"])
    situation_text = SITUATION_LABELS.get(state["situation"], state["situation"])
    llm = _llm(ChatResponse)

    prompt = f"""You are VibeVerse, a warm, empathetic AI companion for introverted
and socially anxious students.

Rules:
- Write EXACTLY 3 sentences. No more.
- Sentence 1: acknowledge their feeling.
- Sentence 2: ONE specific action they can do right now, fitting where they are.
- Sentence 3: a short encouraging line.
- Casual, warm, Gen-Z friendly tone. Never dismissive or overly cheerful.
- Do not start the reply with "I hear you". Vary how you open.
- Do not repeat any action or suggestion you already gave in "The conversation so far". Suggest something new.
- Vary the encouraging closing line. Do not use "You've got the vibe/grit/focus" phrasing every time.
- mood_label must reflect the emotion in the student's NEW message. If the new message has no clear emotion (for example, a plain question), use "okay".
- Past memories below: mention one ONLY if it is directly about the same topic
  as the new message. If it is not clearly related, ignore the memories completely.
  Never mention dates.
- If the new message is about a different topic than the earlier conversation,
  answer only the new topic. Do not bring up earlier topics.

The student is {situation_text}.

Things this student shared in the past:
{memory_block}

The conversation so far:
{recent_block}

Student's new message:
"{state['message']}"
"""

    result: ChatResponse = llm.invoke(prompt)
    state["reply"] = result.reply
    state["mood_label"] = _normalize_mood(result.mood_label)
    return state


def persist(state: GraphState) -> GraphState:
    save_chat_message(state["user_id"], "user", state["message"])
    save_chat_message(state["user_id"], "assistant", state["reply"], state.get("mood_label"))
    return state


def _route_after_classify(state: GraphState) -> str:
    return "safe_response" if state["crisis_flag"] else "retrieve"


def build_graph():
    graph = StateGraph(GraphState)

    graph.add_node("classify_intent", classify_intent)
    graph.add_node("safe_response", safe_response)
    graph.add_node("retrieve", retrieve)
    graph.add_node("generate_reply", generate_reply)
    graph.add_node("persist", persist)

    graph.set_entry_point("classify_intent")
    graph.add_conditional_edges(
        "classify_intent",
        _route_after_classify,
        {"safe_response": "safe_response", "retrieve": "retrieve"},
    )
    graph.add_edge("retrieve", "generate_reply")
    graph.add_edge("generate_reply", "persist")
    graph.add_edge("safe_response", END)
    graph.add_edge("persist", END)

    return graph.compile()


chat_graph = build_graph()
