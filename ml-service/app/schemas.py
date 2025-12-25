# ml-service/app/schemas.py
from pydantic import BaseModel
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
