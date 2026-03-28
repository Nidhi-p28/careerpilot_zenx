from openai import OpenAI
from tools.brightdata import scrape_trends, scrape_jobs
from state.agent_state import CareerPilotState
from memory.mem0_client import recall, remember
import os, json
from loguru import logger

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"),
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)
MODEL = os.getenv("FEATHERLESS_MODEL")


async def trend_agent(state: CareerPilotState) -> CareerPilotState:
    logger.info("[TrendAgent] Starting")
    user_id = state["user_id"]
    profile = state["user_profile"]
    role = profile.get("career_goal", "software engineer")

    # STEP 1 — Reason first, don't blindly scrape
    existing_trends = state.get("trend_data", {})
    reasoning_prompt = f"""
You are the Trend Analysis Agent.

Existing trend data: {json.dumps(existing_trends)}
User role: {role}

Reason through this:
1. Is existing trend data still valid? (older than 3 months = refresh)
2. Do I need to scrape again or is current data sufficient?

Output JSON:
{{
  "should_scrape": true/false,
  "reason": "why you decided this"
}}
"""
    decision = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": reasoning_prompt}],
        temperature=0.2
    )
    decision_text = decision.choices[0].message.content.strip()

    try:
        if "```" in decision_text:
            decision_text = decision_text.split("```")[1].lstrip("json")
        dec = json.loads(decision_text)
    except:
        dec = {"should_scrape": True, "reason": "parse error, defaulting to scrape"}

    logger.info(f"[TrendAgent] Decision: {dec}")

    # STEP 2 — Act based on reasoning
    raw_data = {}
    if dec["should_scrape"]:
        trend_raw = await scrape_trends(role)
        job_raw = await scrape_jobs(role)
        raw_data = {"trends": trend_raw, "jobs": job_raw}
    else:
        raw_data = existing_trends

    # STEP 3 — Analyze and extract structured insights
    analysis_prompt = f"""
You are the Trend Analysis Agent for CareerPilot.

Raw scraped data:
{json.dumps(raw_data, indent=2)[:4000]}

User target role: {role}
User current skills: {profile.get("current_skills", [])}

Extract and output ONLY this JSON:
{{
  "top_skills": ["skill1", "skill2"],
  "trending_tools": ["tool1", "tool2"],
  "skill_gaps": ["what user is missing"],
  "companies_hiring": ["company1"],
  "market_summary": "2-3 sentences",
  "confidence": "high/medium/low"
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
        trend_output = json.loads(raw)
    except:
        trend_output = {"error": "parse failed", "raw": raw}

    remember(user_id, f"Market trends for {role}: {json.dumps(trend_output)}")

    # STEP 4 — Log reasoning
    log = state.get("reasoning_log", [])
    log.append({
        "agent": "TrendAgent",
        "decision": dec["reason"],
        "output_summary": trend_output.get("market_summary", "")
    })

    return {**state, "trend_data": trend_output, "reasoning_log": log}