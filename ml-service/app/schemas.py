# ml-service/app/schemas.py
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class EmotionRequest(BaseModel):
    features: Dict

class EmotionResponse(BaseModel):
    emotion: str
    confidence: float
    probabilities: Dict[str, float]

class AbandonmentRequest(BaseModel):
    features: Dict

class AbandonmentResponse(BaseModel):
    probability: float
    risk_level: str
    factors: Dict[str, float]

class PersonaRequest(BaseModel):
    features: Dict
    method: str = "kmeans_dynamic"

class PersonaResponse(BaseModel):
    primary_cluster: str
    secondary_traits: List[str]
    confidence: float

class FraudRequest(BaseModel):
    features: Dict

class FraudResponse(BaseModel):
    fraud_probability: float
    risk_level: str
    signals: Dict[str, bool]

class SessionData(BaseModel):
    id: str = Field(..., alias='_id')
    intentScore: float = 0.0
    avgScrollDepth: float = 0.0
    totalClicks: int = 0
    pageViews: int = 0
    totalTimeSpent: int = 0
    pagesVisited: List[str] = []
    device: Optional[Dict[str, Any]] = None

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

class ConfusionDetectionRequest(BaseModel):
    mousePath: List[Dict[str, float]]
    timeOnElements: Dict[str, float]

class ContentGenerationRequest(BaseModel):
    persona: str
    content_type: str

class ContentGenerationResponse(BaseModel):
    generated_content: str
