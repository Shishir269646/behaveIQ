import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from typing import List, Dict, Any

class UserClustering:
    """
    User behavior clustering for persona discovery
    """
    
    def __init__(self, min_clusters=3, max_clusters=6):
        self.min_clusters = min_clusters
        self.max_clusters = max_clusters
        self.scaler = StandardScaler()
        self.model = None
        self.optimal_k = None

    def fit_predict(self, data: List[Dict[str, Any]]) -> Dict[int, Dict]:
        """
        Fit clustering model and predict personas
        """
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Feature engineering
        features = self._extract_features(df)
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(features)
        
        # Find optimal number of clusters
        self.optimal_k = self._find_optimal_clusters(X_scaled)
        
        # Fit final model
        self.model = KMeans(n_clusters=self.optimal_k, random_state=42, n_init=10)
        labels = self.model.fit_predict(X_scaled)
        
        # Analyze clusters
        clusters = self._analyze_clusters(df, labels)
        
        return clusters

    def _extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """
        Extract relevant features for clustering
        """
        features = []
        
        for _, row in df.iterrows():
            feature_vector = [
                row.get('intentScore', 0),
                row.get('avgScrollDepth', 0),
                row.get('totalClicks', 0) / max(row.get('pageViews', 1), 1),  # Click rate
                row.get('totalTimeSpent', 0) / 60,  # Time in minutes
                row.get('pageViews', 0),
                len(row.get('pagesVisited', [])),
            ]
            features.append(feature_vector)
        
        return np.array(features)

    def _find_optimal_clusters(self, X: np.ndarray) -> int:
        """
        Find optimal number of clusters using silhouette score
        """
        best_score = -1
        best_k = self.min_clusters
        
        for k in range(self.min_clusters, min(self.max_clusters + 1, len(X))):
            if k >= len(X):
                break
                
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X)
            
            # Calculate silhouette score
            score = silhouette_score(X, labels)
            
            if score > best_score:
                best_score = score
                best_k = k
        
        return best_k

    def _analyze_clusters(self, df: pd.DataFrame, labels: np.ndarray) -> Dict[int, Dict]:
        """
        Analyze each cluster and generate persona information
        """
        df['cluster'] = labels
        clusters = {}
        
        for cluster_id in range(self.optimal_k):
            cluster_data = df[df['cluster'] == cluster_id]
            
            if len(cluster_data) == 0:
                continue
            
            # Calculate metrics
            metrics = {
                "avg_time_spent": cluster_data['totalTimeSpent'].mean(),
                "avg_scroll_depth": cluster_data['avgScrollDepth'].mean(),
                "avg_click_rate": (cluster_data['totalClicks'] / cluster_data['pageViews'].replace(0, 1)).mean(),
                "avg_page_views": cluster_data['pageViews'].mean(),
                "common_pages": self._get_common_pages(cluster_data),
                "common_devices": self._get_common_devices(cluster_data)
            }
            
            # Determine behavior pattern
            behavior_pattern = self._determine_behavior(metrics)
            
            # Generate persona name and description
            name, description = self._generate_persona_info(metrics, behavior_pattern)
            
            clusters[cluster_id] = {
                "name": name,
                "description": description,
                "metrics": metrics,
                "behavior_pattern": behavior_pattern,
                "characteristics": self._extract_characteristics(metrics, behavior_pattern),
                "user_count": len(cluster_data),
                "session_ids": cluster_data.index.tolist()
            }
        
        return clusters

    def _get_common_pages(self, cluster_data: pd.DataFrame) -> List[str]:
        """Get most common pages visited"""
        all_pages = []
        for pages in cluster_data['pagesVisited']:
            if isinstance(pages, list):
                all_pages.extend(pages)
        
        if not all_pages:
            return []
        
        # Count frequency
        page_counts = pd.Series(all_pages).value_counts()
        return page_counts.head(5).index.tolist()

    def _get_common_devices(self, cluster_data: pd.DataFrame) -> List[str]:
        """Get most common devices"""
        devices = cluster_data['device'].apply(lambda x: x.get('type', 'unknown') if isinstance(x, dict) else 'unknown')
        return devices.value_counts().head(3).index.tolist()

    def _determine_behavior(self, metrics: Dict) -> Dict[str, bool]:
        """Determine behavior patterns"""
        return {
            "exploreMore": metrics["avg_page_views"] > 3,
            "quickDecision": metrics["avg_time_spent"] < 60,
            "priceConscious": "pricing" in str(metrics.get("common_pages", [])).lower(),
            "featureFocused": metrics["avg_scroll_depth"] > 0.7
        }

    def _generate_persona_info(self, metrics: Dict, behavior: Dict) -> tuple:
        """Generate persona name and description"""
        if behavior["quickDecision"] and behavior["priceConscious"]:
            name = "Budget Buyer"
            description = "Quick decision-makers focused on price and value"
        elif behavior["exploreMore"] and behavior["featureFocused"]:
            name = "Feature Explorer"
            description = "Thorough researchers who dive deep into product features"
        elif metrics["avg_time_spent"] > 180:
            name = "Careful Researcher"
            description = "Takes time to evaluate all options before deciding"
        elif behavior["quickDecision"]:
            name = "Impulse Buyer"
            description = "Quick to decide with high engagement"
        else:
            name = "Casual Visitor"
            description = "Browsing without immediate purchase intent"
        
        return name, description

    def _extract_characteristics(self, metrics: Dict, behavior: Dict) -> List[str]:
        """Extract persona characteristics"""
        characteristics = []
        
        if metrics["avg_time_spent"] > 120:
            characteristics.append("High engagement")
        if metrics["avg_scroll_depth"] > 0.7:
            characteristics.append("Thorough reader")
        if behavior["quickDecision"]:
            characteristics.append("Quick decision maker")
        if behavior["priceConscious"]:
            characteristics.append("Price conscious")
        if metrics["avg_page_views"] > 4:
            characteristics.append("Multi-page explorer")
        
        return characteristics