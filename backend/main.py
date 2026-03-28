
from dotenv import load_dotenv
load_dotenv()  # ← must be FIRST before any other imports

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.wizard import wizard_router

app = FastAPI(title="CareerPilot API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wizard_router)  # ← wizard first
app.include_router(router)

@app.get("/")
def root():
    return {"status": "CareerPilot running"}
