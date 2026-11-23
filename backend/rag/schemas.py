from pydantic import BaseModel, Field


class ChatResponse(BaseModel):
    reply: str = Field(description="The warm, empathetic reply shown to the user.")
    mood_label: str = Field(
        description="One of exactly: very anxious, nervous, confused, sad, okay, confident"
    )
    used_memory: bool = Field(
        description="True if the reply referenced any retrieved past entries."
    )


class IntentCheck(BaseModel):
    crisis_flag: bool = Field(
        description="True if the message indicates risk of self-harm, suicidal "
                     "ideation, or an acute mental health crisis."
    )
    reasoning: str = Field(description="One short sentence explaining the decision.")


class RehearsalTurnResponse(BaseModel):
    reply: str = Field(description="In-character response from the simulated persona.")
    tone: str = Field(description="Brief description of the persona's tone, e.g. friendly, busy, skeptical, patient.")


class RehearsalFeedback(BaseModel):
    what_went_well: str = Field(description="Specific encouragement on what the student did well (e.g. clarity, politeness, courage).")
    one_tip: str = Field(description="One actionable, practical tip to improve confidence, tone, or effectiveness next time.")
    better_opening_line: str = Field(description="An improved or alternative opening sentence the student could say in this scenario.")

