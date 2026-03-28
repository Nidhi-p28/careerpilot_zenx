from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from memory.mem0_client import remember
import os, json, re
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

wizard_router = APIRouter(prefix="/wizard")

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")

# In-memory store (Replace with Redis/DB for production)
conversation_store = {}

# --- IMPROVED PROMPT TO PREVENT LLM DEBRIS ---
WIZARD_PROMPT = """
You are the CareerPilot Setup Wizard. 
Your goal is to collect 6 fields ONE AT A TIME through natural conversation:
1. career_goal (what career they want)
2. target_role (specific job title)
3. current_level (beginner/intermediate/senior)
4. current_skills (list of skills they have)
5. hours_per_day (how many hours daily)
6. learning_style (video/reading/project-based)

STRICT FORMATTING RULES:
- DO NOT use Markdown (No ***, No **, No #, No `).
- DO NOT use bold or italic text.
- Use plain text only.
- Ask ONLY ONE question at a time.
- If an answer is vague, ask a single follow-up.
- When ALL 6 fields are collected, output ONLY this exact JSON structure:
  {"profile_complete": true, "data": {"career_goal": "...", "target_role": "...", "current_level": "...", "current_skills": [], "hours_per_day": 0, "learning_style": "..."}}

DO NOT provide any text after the JSON.
"""

class WizardMessage(BaseModel):
    user_id: str
    message: str

def extract_json_from_reply(text: str):
    """
    Finds the first '{' and last '}' to extract valid JSON 
    even if the AI included conversational 'debris' around it.
    """
    try:
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end != -1:
            json_str = text[start:end]
            return json.loads(json_str)
    except Exception:
        return None
    return None

def clean_reply_text(text: str):
    """
    Removes common LLM artifacts (***, //, \"") from the conversational text.
    """
    # Remove triple/double asterisks
    text = re.sub(r'\*+', '', text)
    # Remove escaped quotes
    text = text.replace('\\"', '"')
    # Remove raw double slashes if they aren't part of a URL
    text = text.replace('//', '—')
    return text.strip()

@wizard_router.post("/chat")
def wizard_chat(msg: WizardMessage):
    uid = msg.user_id
    if uid not in conversation_store:
        conversation_store[uid] = []

    history = conversation_store[uid]
    history.append({"role": "user", "content": msg.message})

    # Call AI
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": WIZARD_PROMPT}] + history,
        temperature=0.4 # Lower temperature = more consistent JSON
    )

    raw_reply = response.choices[0].message.content
    
    # Attempt to catch the JSON if "profile_complete" exists in the string
    if "profile_complete" in raw_reply:
        parsed = extract_json_from_reply(raw_reply)
        if parsed and parsed.get("profile_complete"):
            # Clean data and save to long-term memory
            profile_data = parsed.get("data", {})
            remember(uid, f"User profile: {json.dumps(profile_data)}")
            
            # Clear wizard history since task is done
            conversation_store[uid] = [] 
            
            return {
                "reply": "SYSTEM_AUTHORIZED: Profile verified. Initializing career intelligence...",
                "profile_complete": True,
                "profile": profile_data
            }

    # If not complete, clean the conversational text for the UI
    clean_reply = clean_reply_text(raw_reply)
    history.append({"role": "assistant", "content": clean_reply})
    conversation_store[uid] = history

    return {"reply": clean_reply, "profile_complete": False}

@wizard_router.get("/history/{user_id}")
def get_history(user_id: str):
    return {"history": conversation_store.get(user_id, [])}

    