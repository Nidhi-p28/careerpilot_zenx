from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from graph.workflow import careerpilot_graph
from memory.mem0_client import recall
import uuid, json
from loguru import logger

router = APIRouter(prefix="/api")

# Thread store — one thread per user for LangGraph
thread_store = {}


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


# ── Start the agent graph ─────────────────────────────

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


# ── Get current state ─────────────────────────────────

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


# ── Approve or reject agent actions ───────────────────

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

    # Update state with approval
    updated_state = dict(current.values)
    updated_state["approval_response"] = {
        "approved": req.approved,
        "item_type": req.item_type,
        "item_data": req.item_data
    }

    # Clear the approved item from pending
    if req.approved:
        updated_state["pending_approvals"] = [
            p for p in updated_state.get("pending_approvals", [])
            if p.get("type") != req.item_type
        ]

    careerpilot_graph.update_state(config, updated_state)

    # Resume graph
    result = await careerpilot_graph.ainvoke(None, config)
    return {
        "status": "resumed",
        "approved": req.approved,
        "state": _safe_state(result)
    }


# ── Get reasoning log (why did agents decide this) ────

@router.get("/reasoning/{user_id}")
def get_reasoning(user_id: str):
    thread_id = thread_store.get(user_id)
    if not thread_id:
        return {"error": "No session"}

    config = {"configurable": {"thread_id": thread_id}}
    state = careerpilot_graph.get_state(config)

    if not state:
        return {"reasoning_log": []}

    return {"reasoning_log": state.values.get("reasoning_log", [])}


# ── Get pending approvals ─────────────────────────────

@router.get("/approvals/{user_id}")
def get_approvals(user_id: str):
    thread_id = thread_store.get(user_id)
    if not thread_id:
        return {"pending": []}

    config = {"configurable": {"thread_id": thread_id}}
    state = careerpilot_graph.get_state(config)

    if not state:
        return {"pending": []}

    return {"pending": state.values.get("pending_approvals", [])}


# ── Memory / profile ──────────────────────────────────

@router.get("/memory/{user_id}")
def get_memory(user_id: str):
    memory = recall(user_id, "all preferences, behavior, history")
    return {"memory": memory}


# ── Helper ────────────────────────────────────────────

def _safe_state(state: dict) -> dict:
    """Return only what frontend needs"""
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