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


def progress_agent(state: CareerPilotState) -> CareerPilotState:
    logger.info("[ProgressAgent] Tracking progress")
    user_id = state["user_id"]
    roadmap = state.get("roadmap", {})
    courses = state.get("courses", [])
    memory = recall(user_id, "completed sessions, skipped sessions, consistency")

    prompt = f"""
You are the Progress Tracking Agent for CareerPilot.

Your job: track what the user has done and detect inconsistencies.

Roadmap: {json.dumps(roadmap, indent=2)[:2000]}
Enrolled courses: {json.dumps(courses, indent=2)[:1000]}
User behavior memory: {memory}

Reason through:
1. What percentage of roadmap is realistically complete?
2. Is the user consistent or skipping sessions?
3. Are they completing courses or abandoning them?
4. Is the user inactive? (no activity detected recently)
5. Does the roadmap need updating based on progress?

Output ONLY JSON:
{{
  "completion_pct": 0,
  "completed_skills": [],
  "in_progress_skills": [],
  "consistency_score": 0,
  "inactive": false,
  "days_inactive": 0,
  "roadmap_needs_update": false,
  "observations": [
    "user completes sessions on weekends faster",
    "user skips Monday consistently"
  ],
  "reasoning": "how you determined this"
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
        progress = json.loads(raw)
    except:
        progress = {"completion_pct": 0, "error": "parse failed"}

    # Store observations in memory
    for obs in progress.get("observations", []):
        remember(user_id, f"Behavior observation: {obs}")

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "ProgressAgent",
        "decision": progress.get("reasoning", ""),
        "output_summary": f"{progress.get('completion_pct', 0)}% complete, inactive: {progress.get('inactive')}"
    })

    return {
        **state,
        "progress": progress,
        "user_inactive": progress.get("inactive", False),
        "roadmap_needs_update": progress.get("roadmap_needs_update", False),
        "reasoning_log": log
    }