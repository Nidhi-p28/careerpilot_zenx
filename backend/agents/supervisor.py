from openai import OpenAI
from state.agent_state import CareerPilotState
from memory.mem0_client import recall
import os, json
from loguru import logger

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")

AGENTS = [
    "trend_agent", "roadmap_agent", "course_agent",
    "progress_agent", "scheduler_agent", "evaluation_agent",
    "job_search_agent", "conflict_resolver", "human_approval", "END"
]


def supervisor(state: CareerPilotState) -> CareerPilotState:
    logger.info("[Supervisor] Evaluating state and routing")
    profile = state.get("user_profile", {})
    user_id = state.get("user_id", "")
    memory = recall(user_id, "recent behavior and progress")

    prompt = f"""
You are the Supervisor/Orchestrator for CareerPilot.

Your job: look at the current state and decide which agent runs next.

Current state:
- User profile complete: {bool(profile)}
- Trend data available: {bool(state.get('trend_data'))}
- Roadmap built: {bool(state.get('roadmap'))}
- Courses found: {bool(state.get('courses'))}
- Progress tracked: {bool(state.get('progress'))}
- Schedule created: {bool(state.get('schedule'))}
- Evaluation done: {bool(state.get('evaluation'))}
- Job ready: {state.get('job_ready', False)}
- Conflict detected: {bool(state.get('conflict_resolution', {}).get('escalate_to_supervisor'))}
- Pending approvals: {len(state.get('pending_approvals', []))}
- Roadmap needs update: {state.get('roadmap_needs_update', False)}

User memory: {memory}

Available agents: {AGENTS}

Reason through:
1. What is the current priority?
2. Is any agent output outdated or invalid?
3. Is there a conflict that needs resolution?
4. Does the user need to approve something?

Output ONLY this JSON:
{{
  "next_agent": "agent_name_from_list",
  "reasoning": "why this agent next",
  "override_previous": false,
  "message_to_agent": "specific instruction for next agent"
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
        decision = json.loads(raw)
    except:
        decision = {"next_agent": "trend_agent", "reasoning": "parse error, defaulting"}

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "Supervisor",
        "decision": decision.get("reasoning", ""),
        "output_summary": f"Routing to: {decision.get('next_agent')}"
    })

    return {
        **state,
        "next_agent": decision.get("next_agent", "END"),
        "task": decision.get("message_to_agent", ""),
        "reasoning_log": log
    }