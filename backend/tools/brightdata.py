import httpx
import os
from loguru import logger

API_KEY = os.getenv("BRIGHTDATA_API_KEY")
BASE_URL = "https://api.brightdata.com"

async def scrape_jobs(role: str, location: str = "India") -> list:
    logger.info(f"[BrightData] Scraping jobs: {role}")
    urls = [
        f"https://www.linkedin.com/jobs/search/?keywords={role}&location={location}",
        f"https://www.indeed.com/jobs?q={role}&l={location}",
        f"https://www.naukri.com/{role.replace(' ','-')}-jobs",
    ]
    results = []
    async with httpx.AsyncClient(timeout=30) as client:
        for url in urls:
            try:
                resp = await client.post(
                    f"{BASE_URL}/datasets/v3/trigger",
                    headers={
                        "Authorization": f"Bearer {API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"dataset_id": "gd_lpfll7v5hcqtkxl6l",
                          "inputs": [{"url": url}]}
                )
                results.append(resp.json())
            except Exception as e:
                logger.error(f"[BrightData] Job scrape failed {url}: {e}")
    return results


async def scrape_courses(skill: str) -> list:
    logger.info(f"[BrightData] Scraping courses: {skill}")
    urls = [
        f"https://www.udemy.com/courses/search/?q={skill}",
        f"https://www.coursera.org/search?query={skill}",
    ]
    results = []
    async with httpx.AsyncClient(timeout=30) as client:
        for url in urls:
            try:
                resp = await client.post(
                    f"{BASE_URL}/datasets/v3/trigger",
                    headers={
                        "Authorization": f"Bearer {API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"dataset_id": "gd_lpfll7v5hcqtkxl6l",
                          "inputs": [{"url": url}]}
                )
                results.append(resp.json())
            except Exception as e:
                logger.error(f"[BrightData] Course scrape failed: {e}")
    return results


async def scrape_trends(role: str) -> dict:
    logger.info(f"[BrightData] Scraping trends: {role}")
    urls = [
        f"https://www.google.com/search?q=top+skills+{role}+2025",
        f"https://github.com/trending",
        f"https://stackoverflow.com/jobs?q={role}",
    ]
    results = []
    async with httpx.AsyncClient(timeout=30) as client:
        for url in urls:
            try:
                resp = await client.post(
                    f"{BASE_URL}/datasets/v3/trigger",
                    headers={
                        "Authorization": f"Bearer {API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"dataset_id": "gd_lpfll7v5hcqtkxl6l",
                          "inputs": [{"url": url}]}
                )
                results.append(resp.json())
            except Exception as e:
                logger.error(f"[BrightData] Trends scrape failed: {e}")
    return {"sources": results}