from typing import TypedDict, Optional, List, Any
from langgraph.graph import MessagesState

class CareerPilotState(TypedDict):
    # User identity
    user_id: str

    # Setup wizard output
    user_profile: dict

    # What each agent produced
    trend_data: dict
    roadmap: dict
    courses: list
    schedule: dict
    progress: dict
    evaluation: dict
    job_listings: list
    conflict_resolution: dict

    # Reasoning trail — every agent explains its decision
    reasoning_log: List[dict]

    # Human approval queue
    pending_approvals: List[dict]
    approval_response: Optional[dict]

    # Supervisor routing
    next_agent: str
    task: str

    # System flags
    roadmap_needs_update: bool
    user_inactive: bool
    trends_changed: bool
    job_ready: bool

    # Conversation history for wizard
    messages: List[dict]