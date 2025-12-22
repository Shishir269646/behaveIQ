import numpy as np
from typing import Dict, List, Any

class IntentScorer:
    """
    Predict user purchase intent based on behavior
    """
    
    def __init__(self):
        # Weights for intent formula
        self.weights = {
            'time': 0.3,
            'scroll': 0.2,
            'click': 0.5
        }

    def predict(
        self,
        time_spent: float,
        scroll_depth: float,
        click_rate: float,
        session_history: List[Dict] = []
    ) -> Dict[str, Any]:
        """
        Predict intent score and level
        """
        # Normalize inputs
        normalized_time = min(time_spent / 300, 1.0)  # Max 5 minutes
        normalized_scroll = scroll_depth
        normalized_click = min(click_rate, 1.0)
        
        # Calculate base intent score
        intent_score = (
            normalized_time * self.weights['time'] +
            normalized_scroll * self.weights['scroll'] +
            normalized_click * self.weights['click']
        )
        
        # Apply history boost
        if session_history:
            history_boost = self._calculate_history_boost(session_history)
            intent_score = min(intent_score + history_boost, 1.0)
        
        # Determine intent level
        intent_level = self._get_intent_level(intent_score)
        
        # Calculate confidence
        confidence = self._calculate_confidence(
            normalized_time,
            normalized_scroll,
            normalized_click
        )
        
        # Identify key factors
        factors = self._identify_factors(
            normalized_time,
            normalized_scroll,
            normalized_click
        )
        
        return {
            "intent_score": round(intent_score, 2),
            "intent_level": intent_level,
            "confidence": round(confidence, 2),
            "factors": factors
        }

    def _calculate_history_boost(self, session_history: List[Dict]) -> float:
        """Calculate boost based on session history"""
        if not session_history:
            return 0.0
        
        # More sessions = higher boost
        session_count = len(session_history)
        boost = min(session_count * 0.05, 0.15)  # Max 15% boost
        
        return boost

    def _get_intent_level(self, score: float) -> str:
        """Determine intent level from score"""
        if score >= 0.7:
            return "high-purchase-intent"
        elif score >= 0.4:
            return "medium-intent"
        else:
            return "low-intent"

    def _calculate_confidence(
        self,
        time: float,
        scroll: float,
        click: float
    ) -> float:
        """Calculate prediction confidence"""
        # Higher variance = lower confidence
        values = [time, scroll, click]
        variance = np.var(values)
        
        # Inverse relationship: low variance = high confidence
        confidence = 1.0 - min(variance, 1.0)
        
        return max(confidence, 0.5)  # Minimum 50% confidence

    def _identify_factors(
        self,
        time: float,
        scroll: float,
        click: float
    ) -> List[str]:
        """Identify key factors driving intent"""
        factors = []
        
        if click > 0.7:
            factors.append("High click engagement")
        if time > 0.6:
            factors.append("Significant time spent")
        if scroll > 0.7:
            factors.append("Deep content exploration")
        
        if not factors:
            factors.append("Low engagement signals")
        
        return factors