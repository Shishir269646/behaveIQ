import numpy as np
from typing import List, Dict

class FeatureEngineer:
    """
    Advanced feature engineering for ML models
    """
    
    @staticmethod
    def create_behavioral_features(session_data: Dict) -> List[float]:
        """
        Create advanced behavioral features from raw session data
        """
        features = []
        
        # Time-based features
        time_spent_minutes = session_data.get('totalTimeSpent', 0) / 60
        features.append(time_spent_minutes)
        features.append(np.log1p(time_spent_minutes))  # Log-transformed time
        
        # Engagement features
        page_views = session_data.get('pageViews', 1)
        features.append(page_views)
        features.append(np.sqrt(page_views))  # Square root transformation
        
        # Click behavior
        total_clicks = session_data.get('totalClicks', 0)
        click_rate = total_clicks / max(page_views, 1)
        features.append(click_rate)
        features.append(total_clicks)
        
        # Scroll behavior
        scroll_depth = session_data.get('avgScrollDepth', 0)
        features.append(scroll_depth)
        features.append(scroll_depth ** 2)  # Squared scroll depth
        
        # Exploration features
        pages_visited = len(session_data.get('pagesVisited', []))
        features.append(pages_visited)
        features.append(pages_visited / max(page_views, 1))  # Unique page ratio
        
        # Intent score
        intent_score = session_data.get('intentScore', 0)
        features.append(intent_score)
        
        # Interaction density (clicks per minute)
        interaction_density = total_clicks / max(time_spent_minutes, 0.1)
        features.append(min(interaction_density, 10))  # Cap at 10
        
        return features

    @staticmethod
    def create_sequential_features(session_history: List[Dict]) -> List[float]:
        """
        Create features from session sequence/history
        """
        if not session_history:
            return [0] * 5
        
        features = []
        
        # Session count
        features.append(len(session_history))
        
        # Average intent across sessions
        avg_intent = np.mean([s.get('intentScore', 0) for s in session_history])
        features.append(avg_intent)
        
        # Intent trend (increasing or decreasing)
        if len(session_history) > 1:
            intent_scores = [s.get('intentScore', 0) for s in session_history]
            intent_trend = np.polyfit(range(len(intent_scores)), intent_scores, 1)[0]
            features.append(intent_trend)
        else:
            features.append(0)
        
        # Days since first visit
        if session_history:
            # Placeholder - would need actual timestamps
            features.append(1)  # Default to 1 day
        else:
            features.append(0)
        
        # Return frequency (visits per day)
        features.append(len(session_history) / max(features[-1], 1))
        
        return features