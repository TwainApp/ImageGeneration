import openai
import os
import json
import random
import textwrap
from utils.env import get_env

PROMPTS_PATH = os.path.join(os.path.dirname(__file__), 'twain_prompts.json')
with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
    PROMPTS = json.load(f)

openai.api_key = get_env("OPENAI_API_KEY")

INTRO_HOOKS = [
    "5 Questions to Ask Your Partner Tonight",
    "Brave Questions for Couples",
    "5 Things to Ask Your Partner Before Bed",
    "5 Deep Questions to Spark Intimacy",
    "Surprising Questions for You and Your Partner",
    "5 Quick Prompts to Reconnect as a Couple",
    "How Well Do You Know Your Partner?",
    "Try These 5 Questions With Your Person",
    "Questions Every Couple Should Try Together"
]

DAYS = [
    "01_Monday", "02_Tuesday", "03_Wednesday",
    "04_Thursday", "05_Friday", "06_Saturday", "07_Sunday"
]

def roll_category_and_difficulty():
    category = random.choice(list(PROMPTS.keys()))
    difficulty = random.choice(["light", "medium", "deep"])
    return category, difficulty, PROMPTS[category][difficulty]

def generate_questions(prompt):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a relationship expert helping couples get closer."},
                {"role": "user", "content": f"{prompt} Give exactly 5 questions. Each must be under 200 characters. Do not number or bullet them. Keep the questions on one line each."}
            ]
        )
        content = response["choices"][0]["message"]["content"].strip()
        lines = [line.strip("–-• ").strip() for line in content.splitlines() if line.strip()]
        if len(lines) == 1:
            alt_split = lines[0].replace("\\n", "\n").replace("?", "?\n").split("\n")
            lines = [q.strip() for q in alt_split if q.strip()]
        if len(lines) >= 5:
            return lines[:5]
        else:
            print(f"[⚠️] Only got {len(lines)} valid questions: {lines}")
            return []
    except Exception as e:
        raise RuntimeError(f"OpenAI error: {e}")

def generate_caption():
    prompt = (
        "Rewrite this social media caption in a fresh, casual way that still means the same thing: "
        '"Questions to explore with your person 💬 Save these to talk through together later." '
        "Keep it short and modern. Do not mention any apps or brands. "
        "Then add 3–5 relevant hashtags at the end, like #relationships #talktogether."
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a social media copywriter for a relationship-focused account."},
                {"role": "user", "content": prompt}
            ]
        )
        return response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print("GPT caption generation failed. Using fallback.")
        return (
            "Questions to explore with your person 💬 Save these to talk through together later. "
            "#relationships #couplesgoals #talktogether #deepquestions"
        ) 