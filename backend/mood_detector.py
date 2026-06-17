# mood_detector.py
# This file is responsible for reading the user's text
# and figuring out what mood/emotion they are feeling.

from textblob import TextBlob  # TextBlob is our NLP library

def detect_mood(text):
    """
    Takes a string of text from the user.
    Returns a mood label like "anxious", "sad", "okay", "happy".
    
    How it works:
    - TextBlob reads the text and gives a 'polarity' score
    - Polarity is a number from -1.0 (very negative) to +1.0 (very positive)
    - We map that number to a human-readable mood label
    """

    # Create a TextBlob object — it analyses the text automatically
    analysis = TextBlob(text)

    # .sentiment.polarity gives a float between -1 and 1
    score = analysis.sentiment.polarity

    # Now we map the score to a mood label
    if score <= -0.5:
        return "very anxious"      # e.g. "I hate everything, I want to run away"
    elif score <= -0.1:
        return "nervous"           # e.g. "I'm a bit scared about today"
    elif score <= 0.1:
        return "confused"          # e.g. "I don't know how to feel"
    elif score <= 0.5:
        return "okay"              # e.g. "Things are fine I guess"
    else:
        return "confident"         # e.g. "I'm feeling great today!"