# ml-service/models/persona_clustering.py
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from typing import Dict, List
import joblib

class PersonaClustering:
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = [
            'avg_session_duration',
            'pages_per_session',
            'cart_adds',
            'purchases',
            'price_sensitivity',
            'research_depth'
        ]
        
        self.persona_map = {
            0: 'budget_buyer',
            1: 'feature_explorer',
            2: 'careful_researcher',
            3: 'impulse_buyer',
            4: 'casual_visitor'
        }
    
    def cluster(self, features: Dict, method: str = "kmeans_dynamic") -> Dict:
        """Perform persona clustering"""
        feature_values = [
            features.get('avg_session_duration', 300),
            features.get('pages_per_session', 5),
            features.get('cart_adds', 1),
            features.get('purchases', 0),
            features.get('price_sensitivity', 0.5),
            features.get('research_depth', 0.5)
        ]
        
        X = np.array([feature_values])
        X_scaled = self.scaler.fit_transform(X)
        
        # Simple rule-based clustering for now
        primary_cluster = self._rule_based_clustering(features)
        secondary_traits = self._identify_secondary_traits(features)
        confidence = self._calculate_confidence(features, primary_cluster)
        
        return {
            'primary_cluster': primary_cluster,
            'secondary_traits': secondary_traits,
            'confidence': confidence
        }
    
    def _rule_based_clustering(self, features: Dict) -> str:
        """Rule-based persona identification"""
        price_sensitivity = features.get('price_sensitivity', 0.5)
        research_depth = features.get('research_depth', 0.5)
        purchases = features.get('purchases', 0)
        cart_adds = features.get('cart_adds', 0)
        
        # Budget Buyer: High price sensitivity
        if price_sensitivity > 0.7:
            return 'budget_buyer'
        
        # Feature Explorer: High research depth
        elif research_depth > 0.7:
            return 'feature_explorer'
        
        # Careful Researcher: High research, medium price sensitivity
        elif research_depth > 0.5 and price_sensitivity > 0.4:
            return 'careful_researcher'
        
        # Impulse Buyer: Quick purchases, low research
        elif purchases > 0 and research_depth < 0.3:
            return 'impulse_buyer'
        
        # Casual Visitor: Default
        else:
            return 'casual_visitor'
    
    def _identify_secondary_traits(self, features: Dict) -> List[str]:
        """Identify secondary persona traits"""
        traits = []
        
        if features.get('price_sensitivity', 0) > 0.5:
            traits.append('price_conscious')
        
        if features.get('research_depth', 0) > 0.5:
            traits.append('detail_oriented')
        
        if features.get('purchases', 0) > 2:
            traits.append('loyal_customer')
        
        return traits[:2]  # Return top 2
    
    def _calculate_confidence(self, features: Dict, persona: str) -> float:
        """Calculate clustering confidence"""
        # Simple confidence based on feature strength
        price_sensitivity = features.get('price_sensitivity', 0.5)
        research_depth = features.get('research_depth', 0.5)
        
        if persona == 'budget_buyer':
            return min(price_sensitivity / 0.7, 1.0)
        elif persona == 'feature_explorer':
            return min(research_depth / 0.7, 1.0)
        else:
            return 0.6  # Default confidence
