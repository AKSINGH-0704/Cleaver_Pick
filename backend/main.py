import logging
from dotenv import load_dotenv

# Load env vars BEFORE importing any service modules that read them at import time
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import evaluate, history, benchmark, health, dashboard

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("CleverPick API v1.0 starting up...")
    yield
    print("CleverPick API shutting down.")

app = FastAPI(
    title="CleverPick API",
    description="LLM Reliability Evaluation Pipeline — Agreement + Verification + Evaluation + Consistency",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://cleverpick.vercel.app",
        # localhost — IPv4, IPv6, and 127.0.0.1 variants for all common Vite ports
        "http://localhost:5173",  "http://127.0.0.1:5173",  "http://[::1]:5173",
        "http://localhost:5174",  "http://127.0.0.1:5174",  "http://[::1]:5174",
        "http://localhost:5175",  "http://127.0.0.1:5175",  "http://[::1]:5175",
        "http://localhost:5176",  "http://127.0.0.1:5176",  "http://[::1]:5176",
        "http://localhost:5177",  "http://127.0.0.1:5177",  "http://[::1]:5177",
        "http://localhost:5178",  "http://127.0.0.1:5178",  "http://[::1]:5178",
        "http://localhost:3000",  "http://127.0.0.1:3000",  "http://[::1]:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluate.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(benchmark.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
