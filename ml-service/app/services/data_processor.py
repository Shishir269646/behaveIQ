import numpy as np
from typing import List, Dict, Any

class DataProcessor:
    """
    Data processing and feature engineering utilities
    """
    
    def process_sessions(self, sessions: List[Dict]) -> List[Dict[str, Any]]:
        """
        Process raw session data for ML models
        """
        processed = []
        
        for session in sessions:
            # Normalize and clean data
            processed_session = {
                'intentScore': self._normalize(session.get('intentScore', 0), 0, 1),
                'avgScrollDepth': self._normalize(session.get('avgScrollDepth', 0), 0, 1),
                'totalClicks': session.get('totalClicks', 0),
                'pageViews': max(session.get('pageViews', 1), 1),
                'totalTimeSpent': session.get('totalTimeSpent', 0),
                'pagesVisited': session.get('pagesVisited', []),
                'device': session.get('device', {'type': 'desktop'})
            }
            
            processed.append(processed_session)
        
        return processed

    def detect_confusion(
        self,
        mouse_path: List[Dict[str, float]],
        time_on_elements: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        Detect confusion zones based on mouse movement and time spent
        """
        confusion_areas = []
        
        # Analyze mouse path for erratic movement
        if len(mouse_path) > 10:
            distances = self._calculate_path_distances(mouse_path)
            avg_distance = np.mean(distances)
            std_distance = np.std(distances)
            
            # High variance in movement indicates confusion
            if std_distance > avg_distance * 0.5:
                confusion_areas.append({
                    "type": "erratic_movement",
                    "selector": "body",
                    "confusionScore": min(std_distance / avg_distance, 1.0),
                    "reason": "Erratic mouse movement detected"
                })
        
        # Analyze time on elements
        for element, time_spent in time_on_elements.items():
            # Long hover without action indicates confusion
            if time_spent > 10:  # More than 10 seconds
                confusion_score = min(time_spent / 30, 1.0)  # Normalize to max 30 seconds
                
                confusion_areas.append({
                    "type": "prolonged_hover",
                    "selector": element,
                    "confusionScore": round(confusion_score, 2),
                    "reason": f"Extended hover time: {time_spent}s"
                })
        
        # Sort by confusion score
        confusion_areas.sort(key=lambda x: x['confusionScore'], reverse=True)
        
        return confusion_areas[:10]  # Return top 10

    def _normalize(self, value: float, min_val: float, max_val: float) -> float:
        """Normalize value to 0-1 range"""
        if max_val == min_val:
            return 0.0
        return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))

    def _calculate_path_distances(self, path: List[Dict[str, float]]) -> List[float]:
        """Calculate distances between consecutive points"""
        distances = []
        
        for i in range(1, len(path)):
            x1, y1 = path[i-1].get('x', 0), path[i-1].get('y', 0)
            x2, y2 = path[i].get('x', 0), path[i].get('y', 0)
            
            distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            distances.append(distance)
        
        return distances