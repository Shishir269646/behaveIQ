from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

# Import schemas
from app.schemas import (
    EmotionRequest, EmotionResponse,
    AbandonmentRequest, AbandonmentResponse,
    PersonaRequest, PersonaResponse,
    FraudRequest, FraudResponse,
    ClusteringRequest, IntentPredictRequest, ContentRecommendationRequest,
    ContentGenerationRequest, ContentGenerationResponse,
    ConfusionDetectionRequest
)

# Import models and services
from app.models.clustering import UserClustering
from app.models.intent_scoring import IntentScorer
from app.models.recommendation import ContentRecommender
from app.models.emotion_model import EmotionPredictor
from app.models.abandonment_model import AbandonmentPredictor
from app.models.persona_clustering import PersonaClustering as PersonaClusterer
from app.models.fraud_model import FraudDetector

from app.services.content_service import ContentService
from app.utils.numpy_json_encoder import to_python_types

router = APIRouter()

# Initialize models
emotion_predictor = EmotionPredictor()
abandonment_predictor = AbandonmentPredictor()
persona_clusterer = PersonaClusterer()
fraud_detector = FraudDetector()

# ═══════════════════════════════════════════════════════════════════════════
# New Endpoints
# ═══════════════════════════════════════════════════════════════════════════

import logging

# ... (other imports)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ... (rest of the file)

@router.post("/predict/emotion", response_model=EmotionResponse)
async def predict_emotion(request: EmotionRequest):
    """
    Predict user emotion from behavioral features
    """
    try:
        if request.page_url:
            logger.info(f"Received emotion prediction request for URL: {request.page_url}")
        result = emotion_predictor.predict(request.features)
        return EmotionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/abandonment", response_model=AbandonmentResponse)
async def predict_abandonment(request: AbandonmentRequest):
    """
    Predict cart abandonment probability
    """
    try:
        result = abandonment_predictor.predict(request.features)
        return AbandonmentResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cluster", response_model=PersonaResponse)
async def cluster_persona(request: PersonaRequest):
    """
    Perform dynamic persona clustering
    """
    try:
        result = persona_clusterer.cluster(request.features, request.method)
        return PersonaResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/fraud", response_model=FraudResponse)
async def predict_fraud(request: FraudRequest):
    """
    Predict fraud probability
    """
    try:
        result = fraud_detector.predict(request.features)
        return FraudResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════
# Existing Routes (from original routes.py)
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/clustering/discover-personas")
async def discover_personas(request: ClusteringRequest):
    """
    Discover user personas using a robust clustering algorithm.
    Handles data quality issues and provides clear error messages.
    """
    try:
        # The UserClustering class now handles its own data processing.
        clustering = UserClustering(
            min_clusters=request.minClusters,
            max_clusters=request.maxClusters
        )
        
        # fit_predict now performs validation, preprocessing, and clustering.
        # It can raise ValueError for specific data quality issues.
        clusters = clustering.fit_predict([s.dict() for s in request.sessionData])

        # Generate persona descriptions
        personas = []
        for cluster_id, cluster_info in clusters.items():
            # Create a consistent ID for the persona
            sanitized_name = "".join(filter(str.isalnum, cluster_info["name"])).lower()
            persona_id = f"persona_{cluster_id}_{sanitized_name}"

            persona = {
                "id": persona_id,
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

        final_response = {
            "success": True,
            "personas": personas,
            "totalClusters": len(personas)
        }
        return to_python_types(final_response)
    
    except ValueError as e:
        # Catches specific data validation errors from the clustering model
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        # Generic fallback for unexpected errors
        raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred: {e}")


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


@router.post("/llm/content-generation", response_model=ContentGenerationResponse)
async def generate_llm_content(request: ContentGenerationRequest):
    """
    Generate content using LLM (OpenAI/Gemini)
    """
    try:
        llm_service = ContentService()
        
        generated_text = llm_service.generate_persona_content(
            persona=request.persona,
            content_type=request.content_type
        )
        if not generated_text:
            raise HTTPException(status_code=500, detail="Failed to generate content.")

        return ContentGenerationResponse(generated_content=generated_text)

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
    # This can be enhanced to dynamically check model health
    return {
        "success": True,
        "models": {
            "clustering": {"status": "ready"},
            "intent_prediction": {"status": "ready"},
            "llm": {"status": "ready"},
            "emotion_prediction": {"status": "ready"},
            "abandonment_prediction": {"status": "ready"},
            "persona_clustering": {"status": "ready"},
            "fraud_detection": {"status": "ready"}
        }
    }