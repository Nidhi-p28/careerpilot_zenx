from openai import OpenAI
from tools.brightdata import scrape_jobs
from state.agent_state import CareerPilotState
from memory.mem0_client import recall, remember
import os, json
from loguru import logger

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")


async def job_search_agent(state: CareerPilotState) -> CareerPilotState:
    logger.info("[JobSearchAgent] Starting")
    user_id = state["user_id"]
    profile = state["user_profile"]
    evaluation = state.get("evaluation", {})
    memory = recall(user_id, "job preferences, rejected jobs, company size preference")

    # Only runs if evaluation says job ready
    if not state.get("job_ready", False):
        logger.info("[JobSearchAgent] User not job ready — skipping")
        log = state.get("reasoning_log", [])
        log.append({
            "agent": "JobSearchAgent",
            "decision": "User not job ready, skipping job search",
            "output_summary": "skipped"
        })
        return {**state, "reasoning_log": log}

    role = profile.get("career_goal", "software engineer")
    raw_jobs = await scrape_jobs(role)

    prompt = f"""
You are the Job Search Agent for CareerPilot.

Raw job listings scraped from LinkedIn, Indeed, Naukri:
{json.dumps(raw_jobs, indent=2)[:4000]}

User profile:
- Target role: {role}
- Acquired skills: {evaluation.get('acquired_skills', [])}
- Job type preference: {profile.get('job_type_preference', 'any')}
- Behavior memory: {memory}

Reason through:
1. Which jobs match the user's CURRENT skills (not future skills)?
2. Filter out jobs requiring skills the user doesn't have yet
3. Rank by match percentage
4. Draft a personalized cold email for the top match

Output ONLY JSON:
{{
  "matched_jobs": [
    {{
      "title": "Junior Python Developer",
      "company": "TechCorp",
      "match_pct": 85,
      "required_skills": ["Python", "SQL"],
      "user_has": ["Python", "SQL"],
      "user_missing": [],
      "location": "Bangalore / Remote",
      "apply_url": "url if found",
      "why_good_match": "reasoning"
    }}
  ],
  "cold_email_draft": {{
    "to": "recruiter@company.com",
    "subject": "Application for Junior Python Developer",
    "body": "email body personalized to user and job"
  }},
  "pending_approval": true,
  "reasoning": "how you filtered and ranked"
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
        job_output = json.loads(raw)
    except:
        job_output = {"error": "parse failed", "raw": raw}

    # Add email draft to approval queue
    pending = state.get("pending_approvals", [])
    pending.append({
        "type": "job_application",
        "data": job_output.get("cold_email_draft", {}),
        "jobs": job_output.get("matched_jobs", []),
        "message": "JobSearchAgent found matches and drafted emails. Approve to send."
    })

    remember(user_id, f"Jobs found: {[j.get('title') for j in job_output.get('matched_jobs', [])]}")

    log = state.get("reasoning_log", [])
    log.append({
        "agent": "JobSearchAgent",
        "decision": job_output.get("reasoning", ""),
        "output_summary": f"{len(job_output.get('matched_jobs', []))} jobs matched"
    })

    return {
        **state,
        "job_listings": job_output.get("matched_jobs", []),
        "pending_approvals": pending,
        "reasoning_log": log
    }