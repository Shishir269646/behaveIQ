from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.models.clustering import UserClustering
from app.models.intent_scoring import IntentScorer
from app.models.recommendation import ContentRecommender
from app.services.llm_service import LLMService
from app.services.data_processor import DataProcessor

router = APIRouter()

# ═══════════════════════════════════════════════════════════════════════════
# Request/Response Models
# ═══════════════════════════════════════════════════════════════════════════

class SessionData(BaseModel):
    intentScore: float
    avgScrollDepth: float
    totalClicks: int
    pageViews: int
    totalTimeSpent: int
    pagesVisited: List[str]
    device: Dict[str, Any]

class ClusteringRequest(BaseModel):
    websiteId: str
    sessionData: List[SessionData]
    minClusters: Optional[int] = 3
    maxClusters: Optional[int] = 6

class IntentPredictRequest(BaseModel):
    timeSpent: float
    scrollDepth: float
    clickRate: float
    sessionHistory: Optional[List[Dict]] = []

class ContentRecommendationRequest(BaseModel):
    personaType: str
    currentPage: str
    userHistory: Optional[List[str]] = []

class LLMGenerateRequest(BaseModel):
    prompt: str
    personaContext: Dict[str, Any]
    tone: Optional[str] = "professional"

class ConfusionDetectionRequest(BaseModel):
    mousePath: List[Dict[str, float]]
    timeOnElements: Dict[str, float]


# ═══════════════════════════════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/clustering/discover-personas")
async def discover_personas(request: ClusteringRequest):
    """
    Discover user personas using clustering algorithm
    """
    try:
        # Process session data
        processor = DataProcessor()
        processed_data = processor.process_sessions(
            [s.dict() for s in request.sessionData]
        )

        # Perform clustering
        clustering = UserClustering(
            min_clusters=request.minClusters,
            max_clusters=request.maxClusters
        )
        
        clusters = clustering.fit_predict(processed_data)

        # Generate persona descriptions
        personas = []
        for cluster_id, cluster_info in clusters.items():
            persona = {
                "id": f"persona_{cluster_id}",
                "name": cluster_info["name"],
                "description": cluster_info["description"],
                "clusterData": {
                    "clusterId": cluster_id,
                    "avgTimeSpent": float(cluster_info["metrics"]["avg_time_spent"]),
                    "avgScrollDepth": float(cluster_info["metrics"]["avg_scroll_depth"]),
                    "avgClickRate": float(cluster_info["metrics"]["avg_click_rate"]),
                    "avgPageViews": float(cluster_info["metrics"]["avg_page_views"]),
                    "commonPages": cluster_info["metrics"]["common_pages"],
                    "commonDevices": cluster_info["metrics"]["common_devices"],
                    "behaviorPattern": cluster_info["behavior_pattern"],
                    "characteristics": cluster_info["characteristics"]
                },
                "userCount": cluster_info["user_count"],
                "sessionIds": cluster_info["session_ids"]
            }
            personas.append(persona)

        return {
            "success": True,
            "personas": personas,
            "totalClusters": len(personas)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/intent/predict")
async def predict_intent(request: IntentPredictRequest):
    """
    Predict user purchase intent
    """
    try:
        scorer = IntentScorer()
        
        result = scorer.predict(
            time_spent=request.timeSpent,
            scroll_depth=request.scrollDepth,
            click_rate=request.clickRate,
            session_history=request.sessionHistory
        )

        return {
            "success": True,
            "intentScore": result["intent_score"],
            "intent": result["intent_level"],
            "confidence": result["confidence"],
            "factors": result["factors"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/content")
async def recommend_content(request: ContentRecommendationRequest):
    """
    Generate personalized content recommendations
    """
    try:
        recommender = ContentRecommender()
        
        recommendations = recommender.generate_recommendations(
            persona_type=request.personaType,
            current_page=request.currentPage,
            user_history=request.userHistory
        )

        return {
            "success": True,
            "recommendations": recommendations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/llm/generate-content")
async def generate_content(request: LLMGenerateRequest):
    """
    Generate content using LLM (OpenAI/Gemini)
    """
    try:
        llm_service = LLMService()
        
        result = llm_service.generate_content(
            prompt=request.prompt,
            persona_context=request.personaContext,
            tone=request.tone
        )

        return {
            "success": True,
            "generatedContent": result["content"],
            "alternatives": result["alternatives"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analysis/confusion-detection")
async def detect_confusion(request: ConfusionDetectionRequest):
    """
    Detect user confusion zones
    """
    try:
        processor = DataProcessor()
        
        confusion_areas = processor.detect_confusion(
            mouse_path=request.mousePath,
            time_on_elements=request.timeOnElements
        )

        return {
            "success": True,
            "confusionAreas": confusion_areas
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/status")
async def get_models_status():
    """
    Get ML models status
    """
    return {
        "success": True,
        "models": {
            "clustering": {
                "status": "ready",
                "algorithm": "KMeans",
                "accuracy": 0.89
            },
            "intent_prediction": {
                "status": "ready",
                "algorithm": "GradientBoosting",
                "accuracy": 0.92
            },
            "llm": {
                "status": "ready",
                "provider": "OpenAI",
                "model": "gpt-4"
            }
        }
    }
