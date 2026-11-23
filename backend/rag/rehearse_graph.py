"""
rehearse_graph.py — LangGraph workflow for Social Rehearsal (Roleplay & Feedback).

Flow:
    classify_intent -> crisis? -> safe_response -> END
                          |
                          no
                          |
              action == "feedback"?
                 /             \
               yes              no
               /                 \
     generate_feedback       generate_persona_turn
             |                         |
            END                       END
"""

import os
from typing import TypedDict, Any
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from rag.schemas import IntentCheck, RehearsalTurnResponse, RehearsalFeedback

GROQ_MODEL = "openai/gpt-oss-120b"

CRISIS_SAFE_RESPONSE = (
    "It sounds like you're going through something really heavy right now, and "
    "I want to make sure you get support beyond what I can offer in a practice session. "
    "In India, you can call the Tele-MANAS mental health helpline at 14416 or "
    "1800-89-14416 for free, 24/7 support. Please also reach out to a trusted "
    "adult or counselor right away. You don't have to go through this alone."
)

SCENARIOS = {
    "canteen_order": {
        "title": "Ordering at the Canteen",
        "persona": "Campus Canteen Cashier / Counter Staff",
        "context": "The student is standing at a busy canteen counter during lunch hour.",
        "gentle_vibe": "Patient, friendly, smiling, gives the student plenty of time to choose.",
        "realistic_vibe": "Casual, brisk, polite but wants to keep the queue moving.",
        "tough_vibe": "Loud background noise, in a hurry, asks 'Next? What do you want?' quickly.",
        "starter_line": "Hey! What can I get for you today?",
    },
    "ask_professor": {
        "title": "Asking the Professor a Question",
        "persona": "College Professor after lecture",
        "context": "The student is approaching the professor at their desk after class with a doubt.",
        "gentle_vibe": "Very approachable, encouraging, happy to see a student asking questions.",
        "realistic_vibe": "Packing up notes, listening attentively, gives thoughtful academic answers.",
        "tough_vibe": "Checking watch, slightly rushed, asks 'Yes? Make it quick, I have a meeting in 5 minutes.'",
        "starter_line": "Yes? Did you have a question about today's lecture?",
    },
    "group_project": {
        "title": "Contributing in a Group Project",
        "persona": "Group Project Teammate",
        "context": "The student is in a team meeting discussing slide division and project topics.",
        "gentle_vibe": "Supportive team member who pauses to listen and asks for input warmly.",
        "realistic_vibe": "Normal college student sharing ideas, receptive to suggestions.",
        "tough_vibe": "Dominant talker, slightly skeptical of new ideas, asks 'Are you sure that will work?'",
        "starter_line": "Okay, we need to finalize our project topic today. Anyone have an idea?",
    },
    "introduce_self": {
        "title": "Introducing Yourself to a Classmate",
        "persona": "Classmate sitting alone before class",
        "context": "The student is sitting next to a peer in the classroom before the lecture starts.",
        "gentle_vibe": "Looking up with a friendly warm smile, glad someone sat nearby.",
        "realistic_vibe": "Glancing up from phone, casual and neutral college student.",
        "tough_vibe": "Wearing headphones, takes one earbud out, looks slightly preoccupied.",
        "starter_line": "Hey there.",
    },
    "presentation_qa": {
        "title": "Class Presentation Q&A",
        "persona": "Curious Audience Member / Peer",
        "context": "The student has just concluded a presentation and opened the floor for questions.",
        "gentle_vibe": "Asks an easy, complimentary question praising the presentation.",
        "realistic_vibe": "Asks a standard clarifying question about one of the main slides.",
        "tough_vibe": "Asks a probing question challenging one of the arguments or data points.",
        "starter_line": "Nice presentation! I had a question about what you mentioned on slide 3.",
    },
}

DIFFICULTY_GUIDES = {
    "gentle": "Be very kind, patient, warm, and supportive. Encourage them and make them feel safe.",
    "realistic": "Be authentic and natural. Sound like an everyday human with normal conversational energy.",
    "tough": "Be somewhat challenging: distracted, pressed for time, or direct, requiring the student to be assertive.",
}


class RehearsalState(TypedDict):
    user_id: int
    scenario: str
    difficulty: str
    message: str
    history: list[dict]
    action: str  # "turn" or "feedback"
    crisis_flag: bool
    persona_reply: str
    persona_tone: str
    feedback: dict | None


def _llm(structured_schema=None):
    model = ChatGroq(model=GROQ_MODEL, api_key=os.environ["GROQ_API_KEY"])
    if structured_schema:
        return model.with_structured_output(structured_schema)
    return model


def _format_history(history: list[dict]) -> str:
    if not history:
        return "(no previous dialogue)"
    lines = []
    for turn in history:
        who = "Student" if turn.get("role") == "user" else "Persona"
        lines.append(f"{who}: {turn.get('content', '')}")
    return "\n".join(lines)


# ── LangGraph Nodes ──────────────────────────────────────

def classify_intent(state: RehearsalState) -> RehearsalState:
    # Only check message if provided
    msg = state.get("message", "").strip()
    if not msg:
        state["crisis_flag"] = False
        return state

    llm = _llm(IntentCheck)
    result: IntentCheck = llm.invoke(
        f"Assess this user statement for crisis-level distress, self-harm, suicidal "
        f"ideation, or acute danger. Message: \"{msg}\""
    )
    state["crisis_flag"] = bool(result.crisis_flag)
    return state


def safe_response(state: RehearsalState) -> RehearsalState:
    state["persona_reply"] = CRISIS_SAFE_RESPONSE
    state["persona_tone"] = "crisis_support"
    state["feedback"] = None
    return state


def generate_persona_turn(state: RehearsalState) -> RehearsalState:
    scenario_info = SCENARIOS.get(state["scenario"], SCENARIOS["canteen_order"])
    diff = state.get("difficulty", "realistic").lower()
    diff_guide = DIFFICULTY_GUIDES.get(diff, DIFFICULTY_GUIDES["realistic"])
    diff_vibe = scenario_info.get(f"{diff}_vibe", scenario_info["realistic_vibe"])

    formatted_history = _format_history(state.get("history", []))

    llm = _llm(RehearsalTurnResponse)
    prompt = f"""You are roleplaying as: {scenario_info['persona']}
Scenario context: {scenario_info['context']}
Difficulty Level: {diff.upper()} ({diff_guide})
Tone/Behavior in this difficulty: {diff_vibe}

Rules:
- Stay strictly in character! Never break character or refer to yourself as an AI.
- Keep your reply concise: 1 to 3 sentences maximum, exactly like a real spoken conversation.
- React directly to what the student said.
- Match the tone: {diff_vibe}

The conversation so far:
{formatted_history}

Student's new spoken statement:
"{state['message']}"
"""
    result: RehearsalTurnResponse = llm.invoke(prompt)
    state["persona_reply"] = result.reply
    state["persona_tone"] = result.tone
    return state


def generate_feedback(state: RehearsalState) -> RehearsalState:
    scenario_info = SCENARIOS.get(state["scenario"], SCENARIOS["canteen_order"])
    diff = state.get("difficulty", "realistic").lower()
    formatted_history = _format_history(state.get("history", []))

    llm = _llm(RehearsalFeedback)
    prompt = f"""You are an encouraging, expert social coach for introverted and socially anxious college students.
The student just completed a social rehearsal roleplay.

Scenario: {scenario_info['title']} ({scenario_info['persona']})
Difficulty: {diff}

Full rehearsal dialogue transcript:
{formatted_history}

Student's final message (if any):
"{state.get('message', '')}"

Provide constructive, warm, actionable feedback:
1. what_went_well: Praise their courage and highlight 1-2 specific things they communicated well (e.g., being polite, making their intent clear, pushing through anxiety).
2. one_tip: Provide ONE concrete, practical technique they can remember when doing this in real life (e.g., eye contact, breathing before speaking, starting with a brief 'Excuse me', speaking up slightly louder).
3. better_opening_line: Suggest an alternative, crisp, and natural opening line they could practice saying out loud right now.
"""
    result: RehearsalFeedback = llm.invoke(prompt)
    state["feedback"] = {
        "what_went_well": result.what_went_well,
        "one_tip": result.one_tip,
        "better_opening_line": result.better_opening_line,
    }
    state["persona_reply"] = "Rehearsal completed! Here is your personalized feedback."
    state["persona_tone"] = "feedback"
    return state


def _route_after_classify(state: RehearsalState) -> str:
    if state["crisis_flag"]:
        return "safe_response"
    if state.get("action") == "feedback":
        return "generate_feedback"
    return "generate_persona_turn"


def build_rehearsal_graph():
    graph = StateGraph(RehearsalState)

    graph.add_node("classify_intent", classify_intent)
    graph.add_node("safe_response", safe_response)
    graph.add_node("generate_persona_turn", generate_persona_turn)
    graph.add_node("generate_feedback", generate_feedback)

    graph.set_entry_point("classify_intent")
    graph.add_conditional_edges(
        "classify_intent",
        _route_after_classify,
        {
            "safe_response": "safe_response",
            "generate_persona_turn": "generate_persona_turn",
            "generate_feedback": "generate_feedback",
        },
    )
    graph.add_edge("safe_response", END)
    graph.add_edge("generate_persona_turn", END)
    graph.add_edge("generate_feedback", END)

    return graph.compile()


rehearsal_graph = build_rehearsal_graph()
