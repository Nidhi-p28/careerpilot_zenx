from loguru import logger
import os
from dotenv import load_dotenv

load_dotenv()

# Simple in-memory store as fallback
_local_memory: dict = {}


def _get_mem0_client():
    try:
        from mem0 import MemoryClient
        api_key = os.getenv("MEM0_API_KEY")
        if not api_key:
            return None
        return MemoryClient(api_key=api_key)
    except Exception as e:
        logger.warning(f"[Mem0] Client init failed: {e}")
        return None


def remember(user_id: str, content: str):
    """Store something about the user"""
    # Always store locally as backup
    if user_id not in _local_memory:
        _local_memory[user_id] = []
    _local_memory[user_id].append(content)

    # Try Mem0 if available
    client = _get_mem0_client()
    if client:
        try:
            client.add(
                messages=[{"role": "user", "content": content}],
                user_id=user_id
            )
            logger.info(f"[Mem0] Stored memory for {user_id}")
        except Exception as e:
            logger.warning(f"[Mem0] Store failed (using local): {e}")


def recall(user_id: str, query: str) -> str:
    """Retrieve relevant memories about the user"""
    # Try Mem0 first
    client = _get_mem0_client()
    if client:
        try:
            results = client.search(query=query, user_id=user_id)
            if results:
                return "\n".join([r["memory"] for r in results])
        except Exception as e:
            logger.warning(f"[Mem0] Recall failed (using local): {e}")

    # Fallback to local memory
    local = _local_memory.get(user_id, [])
    if local:
        return "\n".join(local[-10:])  # last 10 memories

    return "No memory found"


def get_all_memories(user_id: str) -> list:
    """Get everything stored about a user"""
    client = _get_mem0_client()
    if client:
        try:
            return client.get_all(user_id=user_id)
        except Exception as e:
            logger.warning(f"[Mem0] Get all failed: {e}")

    return _local_memory.get(user_id, [])