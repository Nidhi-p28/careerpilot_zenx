from openai import OpenAI
from state.agent_state import CareerPilotState
from memory.mem0_client import recall, remember
import os, json
from loguru import logger

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")


def roadmap_agent(state: CareerPilotState) -> CareerPilotState:
    logger.info("[RoadmapAgent] Starting")
    profile = state["user_profile"]
    trends = state.get("trend_data", {})
    user_id = state["user_id"]
    memory = recall(user_id, "learning behavior and preferences")

    prompt = f"""
You are the Roadmap Agent for CareerPilot.

Before building the roadmap, reason through:
1. Is the user's current level aligned with their target role?
2. Are there prerequisite skills missing that must come first?
3. Given {profile.get('hours_per_day', 2)} hrs/day and 
   {profile.get('urgency_months', 6)} months — is this realistic?

User Profile: {json.dumps(profile)}
Market Trends: {json.dumps(trends)}
User Behavior Memory: {memory}

Rules:
- Skip skills the user already has
- Insert prerequisite skills automatically if missing
- Order by: market demand × skill gap
- Be honest if timeline is unrealistic
- Tag each skill: must_have / nice_to_have

Output ONLY this JSON:
{{
  "reasoning": "why you structured it this way",
  "phases": [
    {{
      "phase": 1,
      "name": "Foundation",
      "completion_pct": 25,
      "skills": [
        {{
          "skill": "Python",
          "priority": "must_have",
          "weeks": 3,
          "reason": "appears in 90% of job posts"
        }}
      ]
    }}
  ],
  "total_weeks": 20,
  "realistic": true,
  "warning": null
}}
"""
    result = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    raw = result.choices[0].message.content.strip()
    try:
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json")
        roadmap = json.loads(raw)
    except:
        roadmap = {"error": "parse failed", "raw": raw}

    remember(user_id, f"Roadmap created: {roadmap.get('total_weeks')} weeks")

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "RoadmapAgent",
        "decision": roadmap.get("reasoning", ""),
        "output_summary": f"{roadmap.get('total_weeks')} week roadmap"
    })

    return {**state, "roadmap": roadmap, "reasoning_log": log}