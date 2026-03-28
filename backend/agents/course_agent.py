from openai import OpenAI
from tools.brightdata import scrape_courses
from state.agent_state import CareerPilotState
from memory.mem0_client import recall, remember
import os, json
from loguru import logger

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")


async def course_agent(state: CareerPilotState) -> CareerPilotState:
    logger.info("[CourseAgent] Starting")
    profile = state["user_profile"]
    roadmap = state.get("roadmap", {})
    user_id = state["user_id"]
    memory = recall(user_id, "course preferences, rejected courses, learning style")

    # Extract skills that need courses
    skills_needing_courses = []
    for phase in roadmap.get("phases", []):
        for skill in phase.get("skills", []):
            if skill.get("priority") == "must_have":
                skills_needing_courses.append(skill["skill"])

    if not skills_needing_courses:
        logger.info("[CourseAgent] No skills need courses yet")
        return state

    # Reason before scraping
    reasoning_prompt = f"""
You are the Course Agent for CareerPilot.

Skills needing courses: {skills_needing_courses}
User learning style: {profile.get('learning_style', 'video')}
User memory: {memory}

Reason:
1. Which skills most urgently need courses right now?
2. Should I scrape fresh courses or are existing ones fine?
3. What type of courses does this user prefer based on memory?

Output ONLY JSON:
{{
  "skills_to_search": ["top 3 skills to find courses for now"],
  "should_scrape": true/false,
  "preferred_type": "video/text/project-based",
  "reasoning": "why"
}}
"""
    dec = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": reasoning_prompt}],
        temperature=0.2
    )
    dec_text = dec.choices[0].message.content.strip()
    try:
        if "```" in dec_text:
            dec_text = dec_text.split("```")[1].lstrip("json")
        decision = json.loads(dec_text)
    except:
        decision = {"skills_to_search": skills_needing_courses[:3],
                    "should_scrape": True, "preferred_type": "video",
                    "reasoning": "parse error"}

    # Scrape courses for each skill
    raw_courses = []
    if decision["should_scrape"]:
        for skill in decision["skills_to_search"]:
            scraped = await scrape_courses(skill)
            raw_courses.append({"skill": skill, "data": scraped})

    # Analyze and rank courses
    analysis_prompt = f"""
You are the Course Agent for CareerPilot.

Raw course data from scraping:
{json.dumps(raw_courses, indent=2)[:4000]}

User constraints:
- Learning style: {profile.get('learning_style', 'video')}
- Hours per day: {profile.get('hours_per_day', 2)}
- Preferred type: {decision['preferred_type']}
- Past behavior: {memory}

For each skill, pick the BEST course and explain why.
Evaluate: rating, duration fit, content relevance, cost.

If a course seems ineffective based on user history, replace it.

Output ONLY JSON:
{{
  "courses": [
    {{
      "skill": "Python",
      "title": "course title",
      "platform": "Udemy",
      "rating": 4.8,
      "duration_hours": 22,
      "cost": "free/paid",
      "why_recommended": "reasoning",
      "effectiveness_score": 85,
      "url": "course url if found"
    }}
  ],
  "pending_approval": true,
  "reasoning": "overall reasoning"
}}
"""
    result = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": analysis_prompt}],
        temperature=0.3
    )
    raw = result.choices[0].message.content.strip()
    try:
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json")
        course_output = json.loads(raw)
    except:
        course_output = {"error": "parse failed", "raw": raw}

    # Add to approval queue
    pending = state.get("pending_approvals", [])
    pending.append({
        "type": "courses",
        "data": course_output.get("courses", []),
        "message": "CourseAgent recommends these courses. Approve to proceed."
    })

    remember(user_id, f"Courses recommended: {[c.get('title') for c in course_output.get('courses', [])]}")

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "CourseAgent",
        "decision": course_output.get("reasoning", ""),
        "output_summary": f"{len(course_output.get('courses', []))} courses found"
    })

    return {
        **state,
        "courses": course_output.get("courses", []),
        "pending_approvals": pending,
        "reasoning_log": log
    }