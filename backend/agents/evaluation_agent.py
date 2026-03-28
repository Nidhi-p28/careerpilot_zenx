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


def evaluation_agent(state: CareerPilotState) -> CareerPilotState:
    logger.info("[EvaluationAgent] Assessing job readiness")
    user_id = state["user_id"]
    profile = state["user_profile"]
    roadmap = state.get("roadmap", {})
    progress = state.get("progress", {})
    trends = state.get("trend_data", {})
    memory = recall(user_id, "skills acquired, projects completed, consistency")

    prompt = f"""
You are the Evaluation Agent for CareerPilot.

This is the most critical agent. You determine if the user is job-ready.
Do NOT be optimistic. Be honest and precise.

User Profile: {json.dumps(profile)}
Market Requirements: {json.dumps(trends.get('top_skills', []))}
Roadmap Progress: {progress.get('completion_pct', 0)}%
Completed Skills: {progress.get('completed_skills', [])}
Consistency Score: {progress.get('consistency_score', 0)}
User Memory: {memory}

Reason through step by step:
1. Required skills vs acquired skills — what % match?
2. Is the user consistent enough to handle a job?
3. Are there critical missing skills that are dealbreakers?
4. Which specific skill gap is most urgent to fix?
5. Overall: job ready or not?

If NOT job ready:
- Identify the single most important missing skill
- Trigger roadmap update for that skill

Output ONLY JSON:
{{
  "job_ready": false,
  "readiness_score": 45,
  "required_skills": ["skill1", "skill2"],
  "acquired_skills": ["skill1"],
  "missing_skills": ["skill2"],
  "critical_gap": "most important missing skill",
  "trigger_roadmap_update": true,
  "recommendation": "what the user should do next",
  "reasoning": "step by step evaluation"
}}
"""
    result = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )
    raw = result.choices[0].message.content.strip()
    try:
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json")
        evaluation = json.loads(raw)
    except:
        evaluation = {"job_ready": False, "error": "parse failed"}

    remember(user_id, f"Evaluation: readiness={evaluation.get('readiness_score')}%, job_ready={evaluation.get('job_ready')}")

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "EvaluationAgent",
        "decision": evaluation.get("reasoning", ""),
        "output_summary": f"Score: {evaluation.get('readiness_score')}%, Ready: {evaluation.get('job_ready')}"
    })

    return {
        **state,
        "evaluation": evaluation,
        "job_ready": evaluation.get("job_ready", False),
        "roadmap_needs_update": evaluation.get("trigger_roadmap_update", False),
        "reasoning_log": log
    }