from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from state.agent_state import CareerPilotState
from agents.supervisor import supervisor
from agents.trend_agent import trend_agent
from agents.roadmap_agent import roadmap_agent
from agents.conflict_resolver import conflict_resolver
from loguru import logger

# Remaining agents as stubs — fill these in same pattern
from agents.course_agent import course_agent
from agents.progress_agent import progress_agent
from agents.scheduler_agent import scheduler_agent
from agents.evaluation_agent import evaluation_agent
from agents.job_search_agent import job_search_agent


def human_approval_node(state: CareerPilotState) -> CareerPilotState:
    """Graph pauses here — resumes when /approve is called"""
    logger.info("[HumanApproval] Waiting for user approval")
    return state


def route_from_supervisor(state: CareerPilotState) -> str:
    next_agent = state.get("next_agent", "END")
    logger.info(f"[Router] → {next_agent}")
    return next_agent


# Build the graph
def build_graph():
    graph = StateGraph(CareerPilotState)

    # Add all nodes
    graph.add_node("supervisor", supervisor)
    graph.add_node("trend_agent", trend_agent)
    graph.add_node("roadmap_agent", roadmap_agent)
    graph.add_node("course_agent", course_agent)
    graph.add_node("progress_agent", progress_agent)
    graph.add_node("scheduler_agent", scheduler_agent)
    graph.add_node("evaluation_agent", evaluation_agent)
    graph.add_node("job_search_agent", job_search_agent)
    graph.add_node("conflict_resolver", conflict_resolver)
    graph.add_node("human_approval", human_approval_node)

    # Entry point
    graph.set_entry_point("supervisor")

    # Supervisor routes to any agent
    graph.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "trend_agent": "trend_agent",
            "roadmap_agent": "roadmap_agent",
            "course_agent": "course_agent",
            "progress_agent": "progress_agent",
            "scheduler_agent": "scheduler_agent",
            "evaluation_agent": "evaluation_agent",
            "job_search_agent": "job_search_agent",
            "conflict_resolver": "conflict_resolver",
            "human_approval": "human_approval",
            "END": END
        }
    )

    # Every agent reports back to supervisor after running
    for agent in [
        "trend_agent", "roadmap_agent", "course_agent",
        "progress_agent", "scheduler_agent", "evaluation_agent",
        "job_search_agent", "conflict_resolver", "human_approval"
    ]:
        graph.add_edge(agent, "supervisor")

    memory = MemorySaver()
    return graph.compile(
        checkpointer=memory,
        interrupt_before=["human_approval"]
    )


careerpilot_graph = build_graph()