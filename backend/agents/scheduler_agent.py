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


def scheduler_agent(state: CareerPilotState) -> CareerPilotState:
    logger.info("[SchedulerAgent] Building schedule")
    user_id = state["user_id"]
    profile = state["user_profile"]
    courses = state.get("courses", [])
    progress = state.get("progress", {})
    memory = recall(user_id, "productive hours, skipped days, schedule preferences")

    prompt = f"""
You are the Scheduler Agent for CareerPilot.

Your job: create a realistic daily/weekly study schedule.
Adjust dynamically based on user behavior — don't repeat mistakes.

User profile:
- Hours per day: {profile.get('hours_per_day', 2)}
- Urgency: {profile.get('urgency_months', 6)} months
- Learning style: {profile.get('learning_style', 'video')}

Current courses: {json.dumps(courses, indent=2)[:1000]}
Progress: {json.dumps(progress, indent=2)}
Behavior memory: {memory}

Reason through:
1. When is this user most productive? (from memory)
2. Which days do they skip? (avoid scheduling heavy tasks)
3. If inactive recently — create a gentle re-engagement plan
4. If job hunting has started — reduce learning hours proportionally

Output ONLY JSON:
{{
  "weekly_schedule": {{
    "Monday": {{"task": "Python basics", "duration_hrs": 2, "time": "evening"}},
    "Tuesday": {{"task": "rest/review", "duration_hrs": 1, "time": "evening"}},
    "Wednesday": {{"task": "Python project", "duration_hrs": 2, "time": "evening"}},
    "Thursday": {{"task": "Python basics", "duration_hrs": 2, "time": "evening"}},
    "Friday": {{"task": "review", "duration_hrs": 1, "time": "evening"}},
    "Saturday": {{"task": "project work", "duration_hrs": 3, "time": "morning"}},
    "Sunday": {{"task": "rest", "duration_hrs": 0, "time": "none"}}
  }},
  "daily_reminder_time": "20:00",
  "re_engagement_plan": null,
  "reasoning": "why this schedule"
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
        schedule = json.loads(raw)
    except:
        schedule = {"error": "parse failed", "raw": raw}

    remember(user_id, f"Schedule created with reminder at {schedule.get('daily_reminder_time')}")

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "SchedulerAgent",
        "decision": schedule.get("reasoning", ""),
        "output_summary": "Weekly schedule created"
    })

    return {**state, "schedule": schedule, "reasoning_log": log}