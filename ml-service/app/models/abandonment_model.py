# ml-service/models/abandonment_model.py
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from typing import Dict
import joblib
import os

class AbandonmentPredictor:
    def __init__(self):
        self.model = None
        self.feature_names = [
            'time_in_cart',
            'scroll_percentage',
            'price_checks',
            'comparisons',
            'previous_abandons',
            'emotion_score',
            'device_score',
            'time_of_day_score',
            'cart_value_score'
        ]
        
        model_path = 'trained_models/abandonment_model.pkl'
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            self.model = self._create_model()
    
    def _create_model(self):
        """Create Gradient Boosting model"""
        model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        
        # Sample training data
        X_train = np.array([
            [300, 45, 5, 3, 2, 0.7, 0.5, 0.8, 0.6],  # High risk
            [120, 80, 2, 1, 0, 0.3, 0.8, 0.5, 0.9],  # Low risk
            [600, 30, 8, 5, 3, 0.9, 0.3, 0.9, 0.4],  # High risk
            [180, 70, 3, 2, 1, 0.4, 0.7, 0.6, 0.8],  # Medium risk
            [450, 40, 6, 4, 2, 0.8, 0.4, 0.7, 0.5]   # High risk
        ])
        y_train = np.array([1, 0, 1, 0, 1])  # 1=abandon, 0=convert
        
        model.fit(X_train, y_train)
        
        os.makedirs('trained_models', exist_ok=True)
        joblib.dump(model, 'trained_models/abandonment_model.pkl')
        
        return model
    
    def predict(self, features: Dict) -> Dict:
        """Predict cart abandonment probability"""
        # Encode emotion
        emotion_map = {
            'frustrated': 0.9,
            'confused': 0.7,
            'considering': 0.5,
            'neutral': 0.3,
            'excited': 0.1
        }
        emotion_score = emotion_map.get(features.get('emotion', 'neutral'), 0.3)
        
        # Encode device
        device_map = {'mobile': 0.3, 'tablet': 0.5, 'desktop': 0.8}
        device_score = device_map.get(features.get('device', 'desktop'), 0.5)
        
        # Time of day score (higher at night = higher risk)
        time_of_day = features.get('time_of_day', 12)
        time_score = 1.0 if time_of_day >= 22 or time_of_day <= 6 else 0.5
        
        # Cart value score (higher value = lower risk)
        cart_value = features.get('cart_value', 1000)
        cart_score = min(cart_value / 5000, 1.0)
        
        feature_values = [
            features.get('time_in_cart', 0),
            features.get('scroll_percentage', 50),
            features.get('price_checks', 0),
            features.get('comparisons', 0),
            features.get('previous_abandons', 0),
            emotion_score,
            device_score,
            time_score,
            cart_score
        ]
        
        X = np.array([feature_values])
        
        probability = float(self.model.predict_proba(X)[0][1])
        
        # Determine risk level
        if probability > 0.7:
            risk_level = 'high'
        elif probability > 0.4:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # Feature importance (simplified)
        factors = {
            'time_factor': feature_values[0] / 600,  # Normalize
            'engagement_factor': 1 - (feature_values[1] / 100),
            'comparison_factor': min(feature_values[3] / 5, 1),
            'emotion_factor': emotion_score,
            'history_factor': min(feature_values[4] / 5, 1)
        }
        
        return {
            'probability': probability,
            'risk_level': risk_level,
            'factors': factors
        }
