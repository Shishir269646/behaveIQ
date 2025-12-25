# ml-service/models/fraud_model.py
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import Dict
import joblib
import os

class FraudDetector:
    def __init__(self):
        self.model = None
        self.feature_names = [
            'checkout_speed',
            'mouse_movements',
            'failed_payments',
            'email_pattern_score',
            'location_anomaly'
        ]
        
        model_path = 'trained_models/fraud_model.pkl'
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            self.model = self._create_model()
    
    def _create_model(self):
        """Create fraud detection model"""
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42
        )
        
        # Sample training data
        X_train = np.array([
            [5, 0, 3, 0.9, 0.8],    # High fraud
            [120, 50, 0, 0.1, 0.2], # Low fraud
            [8, 2, 2, 0.7, 0.6],    # Medium fraud
            [180, 80, 0, 0.2, 0.1], # Low fraud
            [3, 0, 4, 0.95, 0.9]    # High fraud
        ])
        y_train = np.array([1, 0, 1, 0, 1])
        
        model.fit(X_train, y_train)
        
        os.makedirs('trained_models', exist_ok=True)
        joblib.dump(model, 'trained_models/fraud_model.pkl')
        
        return model
    
    def predict(self, features: Dict) -> Dict:
        """Predict fraud probability"""
        feature_values = [
            features.get('checkout_speed', 60),
            features.get('mouse_movements', 50),
            features.get('failed_payments', 0),
            features.get('email_pattern_score', 0.3),
            features.get('location_anomaly', 0.2)
        ]
        
        X = np.array([feature_values])
        
        probability = float(self.model.predict_proba(X)[0][1])
        
        risk_level = 'high' if probability > 0.7 else \
                    'medium' if probability > 0.4 else 'low'
        
        signals = {
            'too_fast': feature_values[0] < 15,
            'no_mouse': feature_values[1] < 5,
            'payment_issues': feature_values[2] > 1,
            'suspicious_email': feature_values[3] > 0.6,
            'location_mismatch': feature_values[4] > 0.5
        }
        
        return {
            'fraud_probability': probability,
            'risk_level': risk_level,
            'signals': signals
        }
