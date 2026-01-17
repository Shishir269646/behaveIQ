from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

from app.api.routes import router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="BEHAVEIQ ML Service",
    description="Machine Learning service for user behavior analysis and personalization",
    version="1.0.0"
)

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """
    Custom exception handler for Pydantic ValidationErrors to log details.
    """
    error_details = exc.errors()
    logger.error(f"Validation error for request to {request.url}:")
    logger.error(error_details)
    # Also log the request body if available
    try:
        body = await request.json()
        logger.error(f"Request body: {body}")
    except Exception as e:
        logger.error(f"Could not log request body: {e}")

    return JSONResponse(
        status_code=422,
        content={"detail": error_details},
    )


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/ml/v1")

@app.get("/")
async def root():
    return {
        "service": "BEHAVEIQ ML Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models": {
            "clustering": "ready",
            "intent_scoring": "ready",
            "llm": "ready",
            "emotion_prediction": "ready",
            "abandonment_prediction": "ready",
            "persona_clustering": "ready",
            "fraud_detection": "ready"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
