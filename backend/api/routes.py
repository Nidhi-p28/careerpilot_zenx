import os
import shutil
import uuid
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from loguru import logger

# Import your custom modules

from graph.workflow import careerpilot_graph
from memory.mem0_client import recall
from tools.email_service import send_hiring_email

router = APIRouter(prefix="/api")

# Thread store — one thread per user for LangGraph
thread_store = {}

# --- SCHEMAS ──────────────────────────────────────────

class StartRequest(BaseModel):

    user_id: str

    profile: dict



class ApprovalRequest(BaseModel):

    user_id: str

    item_type: str

    approved: bool

    item_data: dict = {}



class UpdateRequest(BaseModel):

    user_id: str

    field: str

    value: dict



# --- CORE AGENT OPERATIONS ────────────────────────────



@router.post("/start")

async def start_agent(req: StartRequest):

    uid = req.user_id

    thread_id = str(uuid.uuid4())

    thread_store[uid] = thread_id



    initial_state = {

        "user_id": uid,

        "user_profile": req.profile,

        "trend_data": {},

        "roadmap": {},

        "courses": [],

        "schedule": {},

        "progress": {},

        "evaluation": {},

        "job_listings": [],

        "conflict_resolution": {},

        "reasoning_log": [],

        "pending_approvals": [],

        "approval_response": None,

        "next_agent": "",

        "task": "",

        "roadmap_needs_update": False,

        "user_inactive": False,

        "trends_changed": False,

        "job_ready": False,

        "messages": []

    }



    config = {"configurable": {"thread_id": thread_id}}



    try:

        result = await careerpilot_graph.ainvoke(initial_state, config)

        return {

            "status": "running",

            "thread_id": thread_id,

            "state": _safe_state(result)

        }

    except Exception as e:

        logger.error(f"Graph error: {e}")

        return {"status": "error", "message": str(e)}



@router.get("/state/{user_id}")

def get_state(user_id: str):

    thread_id = thread_store.get(user_id)

    if not thread_id:

        return {"error": "No session found"}



    config = {"configurable": {"thread_id": thread_id}}

    state = careerpilot_graph.get_state(config)



    if not state or not state.values:

        return {"error": "No state found"}



    return {"state": _safe_state(state.values)}



@router.post("/approve")

async def approve_action(req: ApprovalRequest):

    uid = req.user_id

    thread_id = thread_store.get(uid)

    if not thread_id:

        return {"error": "No session found"}



    config = {"configurable": {"thread_id": thread_id}}

    current = careerpilot_graph.get_state(config)



    if not current:

        return {"error": "No state"}



    updated_state = dict(current.values)

    updated_state["approval_response"] = {

        "approved": req.approved,

        "item_type": req.item_type,

        "item_data": req.item_data

    }



    if req.approved:

        updated_state["pending_approvals"] = [

            p for p in updated_state.get("pending_approvals", [])

            if p.get("type") != req.item_type

        ]



    careerpilot_graph.update_state(config, updated_state)

    result = await careerpilot_graph.ainvoke(None, config)

   

    return {

        "status": "resumed",

        "approved": req.approved,

        "state": _safe_state(result)

    }



# --- RESUME & OUTREACH SERVICES ───────────────────────



@router.post("/upload-resume")

async def upload_resume(user_id: str, file: UploadFile = File(...)):

    try:

        # 1. Setup storage path

        upload_dir = os.path.join("storage", "resumes")

        os.makedirs(upload_dir, exist_ok=True)

        file_location = os.path.join(upload_dir, f"{user_id}_resume.pdf")

       

        # 2. Save file using buffer stream

        with open(file_location, "wb") as buffer:

            shutil.copyfileobj(file.file, buffer)

       

        # 3. Update the Graph State if thread exists

        thread_id = thread_store.get(user_id)

        if thread_id:

            config = {"configurable": {"thread_id": thread_id}}

            careerpilot_graph.update_state(config, {"resume_path": file_location})

            logger.info(f"Resume path linked to graph for user {user_id}")

       

        return {"status": "SUCCESS", "info": "RESUME_STORED_AT_PATH", "path": file_location}

   

    except Exception as e:

        logger.error(f"Resume upload failed: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.post("/apply-now")

async def apply_now(data: dict):

    user_id = data.get("user_id")

    job_details = data.get("job")

   

    # Retrieve current state from graph

    thread_id = thread_store.get(user_id)

    if not thread_id:

        return {"status": "ERROR", "message": "SESSION_EXPIRED"}

       

    config = {"configurable": {"thread_id": thread_id}}

    state = careerpilot_graph.get_state(config).values

   

    resume_path = state.get("resume_path")

    if not resume_path or not os.path.exists(resume_path):

        return {"status": "ERROR", "message": "RESUME_NOT_FOUND"}



    # Simulate email drafting (Replace with your actual draft tool)

    email_body = f"Hi, I'm interested in the {job_details.get('title')} position."



    success = await send_hiring_email(

        to_email="itsmelilac143@gmail.com",

        subject=f"Application: {job_details.get('title')}",

        body=email_body,

        resume_path=resume_path

    )



    return {"status": "SUCCESS" if success else "FAILED"}



# --- UTILS & HELPERS ──────────────────────────────────



@router.get("/memory/{user_id}")

def get_memory(user_id: str):

    memory = recall(user_id, "all preferences, behavior, history")

    return {"memory": memory}



def _safe_state(state: dict) -> dict:

    """Filters internal graph state for frontend consumption"""

    return {

        "roadmap": state.get("roadmap", {}),

        "courses": state.get("courses", []),

        "schedule": state.get("schedule", {}),

        "progress": state.get("progress", {}),

        "evaluation": state.get("evaluation", {}),

        "job_listings": state.get("job_listings", []),

        "job_ready": state.get("job_ready", False),

        "pending_approvals": state.get("pending_approvals", []),

        "reasoning_log": state.get("reasoning_log", []),

        "trend_data": state.get("trend_data", {}),

        "next_agent": state.get("next_agent", ""),

        "conflict_resolution": state.get("conflict_resolution", {})

    }
