from openai import OpenAI
from state.agent_state import CareerPilotState
import os, json
from loguru import logger

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")


def conflict_resolver(state: CareerPilotState) -> CareerPilotState:
    logger.info("[ConflictResolver] Analyzing tradeoffs")
    profile = state["user_profile"]
    roadmap = state.get("roadmap", {})
    evaluation = state.get("evaluation", {})
    progress = state.get("progress", {})

    prompt = f"""
You are the Conflict Resolver Agent for CareerPilot.

Your job: identify and resolve tradeoffs between competing agent goals.

Current situation:
- User urgency: {profile.get('urgency_months')} months to job
- Roadmap completion: {progress.get('completion_pct', 0)}%
- Job readiness score: {evaluation.get('readiness_score', 0)}
- Hours/day available: {profile.get('hours_per_day', 2)}
- Missing skills: {evaluation.get('missing_skills', [])}

Tradeoffs to evaluate:
1. TIME vs DEPTH — should user go deep on fewer skills or broad across many?
2. INTEREST vs DEMAND — user prefers {profile.get('learning_style')} but 
   market demands certain skills regardless
3. SPEED vs QUALITY — apply for jobs now vs wait until more prepared?

For each tradeoff, reason through both sides then decide.

Output ONLY this JSON:
{{
  "tradeoffs": [
    {{
      "type": "speed_vs_quality",
      "option_a": "apply now",
      "option_b": "wait 4 more weeks",
      "decision": "which one and why",
      "reasoning": "detailed reasoning"
    }}
  ],
  "final_recommendation": "overall what should happen next",
  "escalate_to_supervisor": true/false,
  "escalation_reason": "why if escalating"
}}
"""
    result = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4
    )
    raw = result.choices[0].message.content.strip()
    try:
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json")
        resolution = json.loads(raw)
    except:
        resolution = {"error": "parse failed", "raw": raw}

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "ConflictResolver",
        "decision": resolution.get("final_recommendation", ""),
        "output_summary": f"Escalate: {resolution.get('escalate_to_supervisor')}"
    })

    return {**state, "conflict_resolution": resolution, "reasoning_log": log}