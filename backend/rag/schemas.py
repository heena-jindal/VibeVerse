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
