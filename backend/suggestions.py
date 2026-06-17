# suggestions.py
# This file contains the "brain" of our suggestion engine.
# Given a mood + situation, it returns helpful advice.

# This is a dictionary (like a lookup table).
# Key = (mood, situation) pair
# Value = the advice string to show the user
SUGGESTIONS = {
    ("very anxious", "in_class"): 
        "Take 3 slow deep breaths. You don't need to talk — just focus on writing one thing you hear.",

    ("nervous", "in_class"): 
        "Try making brief eye contact with the teacher and nodding. It makes you feel connected without speaking.",

    ("confused", "in_class"): 
        "Write your confusion as a question on paper first. You can ask it verbally or show the teacher after class.",

    ("okay", "in_class"): 
        "This is a good time to smile at a classmate nearby. A small smile is a great first step.",

    ("confident", "in_class"): 
        "Raise your hand to answer one question today. You've got this!",

    ("very anxious", "canteen"): 
        "Find a corner seat where you can eat quietly. It's okay to be alone — you're recharging.",

    ("nervous", "canteen"): 
        "Get your food first, then look for someone sitting alone. A simple 'mind if I sit here?' is enough.",

    ("confused", "canteen"): 
        "It's okay to not know where to go. Just pick any open seat — most people are focused on their own food.",

    ("okay", "canteen"): 
        "Try sitting near a group (not with them). Being nearby is a gentle first step to social exposure.",

    ("confident", "canteen"): 
        "Join a table and introduce yourself with just your name. That's all you need to start.",

    ("very anxious", "first_day"): 
        "Focus only on today. Find one classroom, one seat. That's your only job for now.",

    ("nervous", "first_day"): 
        "Look for someone who also looks a little lost — they'll be relieved you spoke first.",

    ("confused", "first_day"): 
        "Ask someone 'Do you know where Room X is?' — it's a natural, low-pressure conversation starter.",

    ("okay", "first_day"): 
        "Say your name to one new person today. Just one. That counts as a win.",

    ("confident", "first_day"): 
        "Introduce yourself to your neighbour in the first class. Ask what subject they're most excited about.",

    ("very anxious", "group_project"): 
        "You can contribute by typing — offer to be the note-taker. It's valuable and low pressure.",

    ("nervous", "group_project"): 
        "Share one idea in writing (group chat or paper) before the meeting. Seeing your idea accepted builds confidence.",

    ("confused", "group_project"): 
        "Ask the group 'Can someone explain their idea more?' — this shows engagement and helps everyone clarify.",

    ("okay", "group_project"): 
        "Offer to handle one specific task. Ownership of a small part makes you feel part of the team.",

    ("confident", "group_project"): 
        "Try leading one part of the project meeting — even just asking 'What should we do next?'",

    ("very anxious", "presentation"): 
        "Look at the back wall just above the audience's heads. It feels like eye contact but isn't — much calmer.",

    ("nervous", "presentation"): 
        "Start with 'Hello, I'm [name] and today I'll talk about...' — the first sentence is the hardest. After that it flows.",

    ("confused", "presentation"): 
        "Write your opening line on a card and memorise only that. The rest you can read from notes.",

    ("okay", "presentation"): 
        "Pause for 2 seconds after each point. Silence feels long to you but helps the audience absorb ideas.",

    ("confident", "presentation"): 
        "Make eye contact with 3 different people during your talk. It makes your delivery feel personal and strong.",
}

def get_suggestion(mood, situation):
    """
    Looks up the suggestion for a given mood + situation pair.
    If no exact match found, returns a helpful default message.
    """
    # .get() safely looks up a key — returns the second argument if not found
    key = (mood, situation)
    return SUGGESTIONS.get(
        key,
        "Take a moment to breathe. Every situation is manageable one small step at a time. You're doing great by being here."
    )