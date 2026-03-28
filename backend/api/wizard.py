from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from memory.mem0_client import remember
import os, json
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

wizard_router = APIRouter(prefix="/wizard")

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")

conversation_store = {}

WIZARD_PROMPT = """
You are the CareerPilot setup wizard. 
Collect these fields ONE AT A TIME through natural conversation:

1. career_goal (what career they want)
2. current_level (beginner/intermediate/senior)
3. current_skills (list of skills they have)
4. hours_per_day (how many hours daily)
5. learning_style (video/reading/project-based)

Rules:
- ONE question at a time
- If answer is vague, ask follow-up
- Never ask what was already answered
- Be conversational and friendly
- When ALL 5 fields collected, output ONLY this exact JSON:
  {"profile_complete": true, "data": {all 5 fields here}}
- Until complete, just ask next question naturally
- Do NOT output JSON until truly complete
"""


class WizardMessage(BaseModel):
    user_id: str
    message: str


@wizard_router.post("/chat")
def wizard_chat(msg: WizardMessage):
    uid = msg.user_id
    if uid not in conversation_store:
        conversation_store[uid] = []

    history = conversation_store[uid]
    history.append({"role": "user", "content": msg.message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": WIZARD_PROMPT}] + history,
        temperature=0.5
    )

    reply = response.choices[0].message.content
    history.append({"role": "assistant", "content": reply})
    conversation_store[uid] = history

    # Check if profile complete
    try:
        if "profile_complete" in reply:
            cleaned = reply.strip()
            if "```" in cleaned:
                cleaned = cleaned.split("```")[1].lstrip("json")
            parsed = json.loads(cleaned)
            if parsed.get("profile_complete"):
                remember(uid, f"User profile: {json.dumps(parsed['data'])}")
                return {
                    "reply": "Great! Your profile is complete. Setting up your career intelligence system...",
                    "profile_complete": True,
                    "profile": parsed["data"]
                }
    except Exception as e:
        logger.error(f"Wizard error: {str(e)}")
        return {
            "reply": f"Error: {str(e)}",
            "profile_complete": False
        }
        

    return {"reply": reply, "profile_complete": False}


@wizard_router.get("/history/{user_id}")
def get_history(user_id: str):
    return {"history": conversation_store.get(user_id, [])}