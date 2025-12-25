# ml-service/models/emotion_model.py
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import Dict
import joblib
import os

class EmotionPredictor:
    def __init__(self):
        self.model = None
        self.emotions = ['frustrated', 'confused', 'excited', 'neutral', 'considering']
        self.feature_names = [
            'mouse_speed_variance',
            'avg_mouse_speed',
            'scroll_depth_changes',
            'click_hesitation_time',
            'time_on_page'
        ]
        
        # Load pre-trained model or create new
        model_path = 'trained_models/emotion_model.pkl'
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            self.model = self._create_model()
    
    def _create_model(self):
        """Create and train initial model with sample data"""
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Sample training data (replace with real data)
        X_train = np.array([
            [1200, 250, 80, 500, 45000],   # frustrated
            [400, 80, 20, 2000, 60000],    # confused
            [600, 180, 90, 200, 30000],    # excited
            [500, 120, 50, 800, 40000],    # neutral
            [300, 100, 30, 1500, 80000]    # considering
        ])
        y_train = np.array([0, 1, 2, 3, 4])  # emotion indices
        
        model.fit(X_train, y_train)
        
        # Save model
        os.makedirs('trained_models', exist_ok=True)
        joblib.dump(model, 'trained_models/emotion_model.pkl')
        
        return model
    
    def predict(self, features: Dict) -> Dict:
        """Predict emotion from features"""
        # Extract features in correct order
        feature_values = [
            features.get('mouse_speed_variance', 500),
            features.get('avg_mouse_speed', 120),
            features.get('scroll_depth_changes', 50),
            features.get('click_hesitation_time', 800),
            features.get('time_on_page', 40000)
        ]
        
        X = np.array([feature_values])
        
        # Get prediction
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        emotion = self.emotions[prediction]
        confidence = float(probabilities[prediction])
        
        prob_dict = {
            self.emotions[i]: float(prob) 
            for i, prob in enumerate(probabilities)
        }
        
        return {
            'emotion': emotion,
            'confidence': confidence,
            'probabilities': prob_dict
        }
