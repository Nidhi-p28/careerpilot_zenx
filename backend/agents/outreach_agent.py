from openai import OpenAI
import os, json
from loguru import logger

client = OpenAI(
    api_key=os.getenv("FEATHERLESS_API_KEY"), 
    base_url=os.getenv("FEATHERLESS_BASE_URL")
)

async def outreach_agent(state: dict) -> dict:
    jobs = state.get("job_listings", []) # Match your safe_state key
    profile = state.get("user_profile", {})
    
    # 1. HARD BLOCK: NO RESUME
    if not state.get("resume_path"):
        logger.warning(f"OUTREACH_ABORTED: No resume found for user {state.get('user_id')}")
        return {**state, "next_agent": "human_approval", "task": "RESUME_REQUIRED_FOR_OUTREACH"}

    # 2. DRAFTING LOOP
    pending_emails = []
    # Take top 3 jobs to avoid hitting LLM rate limits
    for job in jobs[:3]:
        try:
            prompt = f"""
            Draft a high-conversion cold email to a recruiter for: {job.get('title')} at {job.get('company')}.
            User Skills: {profile.get('current_skills', 'General Experience')}
            Tone: Professional, brief, and technical.
            Reference the resume attached.
            
            Output ONLY valid JSON:
            {{
                "recipient_email": "{job.get('recruiter_email', 'itsmelilac143@gmail.com')}",
                "subject": "Application: {job.get('title')} - {profile.get('name')}",
                "body": "Your drafted email content here...",
                "job_id": "{job.get('id', 'N/A')}"
            }}
            """
            
            response = client.chat.completions.create(
                model="meta-llama/llama-3-70b-instruct", # Or your preferred model
                messages=[{"role": "user", "content": prompt}],
                response_format={ "type": "json_object" }
            )
            
            draft = json.loads(response.choices[0].message.content)
            pending_emails.append(draft)
            
        except Exception as e:
            logger.error(f"DRAFTING_ERROR for job {job.get('id')}: {e}")

    # 3. UPDATE STATE
    pending = state.get("pending_approvals", [])
    if pending_emails:
        pending.append({
            "type": "outreach_batch",
            "data": pending_emails,
            "message": f"Agent drafted {len(pending_emails)} custom emails. Review and authorize dispatch."
        })

    return {**state, "pending_approvals": pending, "next_agent": "human_approval"}