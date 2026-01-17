import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.feature_selection import VarianceThreshold
from typing import List, Dict, Any

class UserClustering:
    """
    Robust user behavior clustering for persona discovery.
    Handles data quality issues and prevents crashes.
    """
    
    def __init__(self, min_clusters=3, max_clusters=6):
        if not isinstance(min_clusters, int) or not isinstance(max_clusters, int) or min_clusters <= 0 or max_clusters < min_clusters:
            raise ValueError("min_clusters and max_clusters must be positive integers, and max_clusters must be >= min_clusters.")
        self.min_clusters = min_clusters
        self.max_clusters = max_clusters
        self.scaler = StandardScaler()
        self.model = None
        self.optimal_k = None
        # Define feature names for clarity and consistency
        self.feature_names = [
            'intentScore', 'avgScrollDepth', 'clickRate', 
            'totalTimeSpent_minutes', 'pageViews', 'pagesVisited_count'
        ]

    def fit_predict(self, data: List[Dict[str, Any]]) -> Dict[int, Dict]:
        """
        Fit clustering model and predict personas with robust data preprocessing.
        """
        if not data:
            raise ValueError("Input data cannot be empty.")

        df = pd.DataFrame(data).set_index('id')
        
        # 1. Feature Engineering
        features_df = self._extract_features(df)
        
        # 2. Filter out sessions with no meaningful behavioral data
        behavioral_cols = ['avgScrollDepth', 'totalClicks', 'totalTimeSpent', 'pageViews']
        original_indices = features_df.index
        # Keep rows where at least one behavioral column is non-zero
        active_features_df = features_df[features_df[behavioral_cols].any(axis=1)]

        if active_features_df.empty:
            raise ValueError("No active user sessions found. All sessions have zero engagement.")

        # Map back to original session data for analysis later
        active_df = df.loc[active_features_df.index]
        X_raw = active_features_df[self.feature_names].values

        # 3. Validate data quantity for clustering
        if X_raw.shape[0] < self.min_clusters:
            # Not enough data for meaningful clustering, fallback to a single cluster
            labels = np.zeros(X_raw.shape[0], dtype=int)
            self.optimal_k = 1
            return self._analyze_clusters(active_df, labels)

        # 4. Preprocessing Pipeline
        # Remove features with zero variance (e.g., if all users have 0 page views)
        variance_selector = VarianceThreshold()
        try:
            X_high_variance = variance_selector.fit_transform(X_raw)
        except ValueError:
             # This can happen if X_raw is empty, though we already checked for that
            raise ValueError("Failed to apply variance threshold.")

        if X_high_variance.shape[1] == 0:
            # All features had zero variance, treat as a single cluster
            labels = np.zeros(X_raw.shape[0], dtype=int)
            self.optimal_k = 1
            return self._analyze_clusters(active_df, labels)
            
        # Scale features
        X_scaled = self.scaler.fit_transform(X_high_variance)
        
        # Final check: if all scaled data points are identical, clustering is pointless
        if np.all(X_scaled == X_scaled[0, :]):
            labels = np.zeros(X_raw.shape[0], dtype=int)
            self.optimal_k = 1
            return self._analyze_clusters(active_df, labels)

        # 5. Find optimal number of clusters
        self.optimal_k = self._find_optimal_clusters(X_scaled)
        
        # 6. Fit final model
        self.model = KMeans(n_clusters=self.optimal_k, random_state=42, n_init='auto')
        labels = self.model.fit_predict(X_scaled)
        
        # 7. Analyze clusters
        return self._analyze_clusters(active_df, labels)

    def _extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract relevant features and return a new DataFrame.
        """
        features_df = pd.DataFrame(index=df.index)
        features_df['intentScore'] = df['intentScore'].fillna(0)
        features_df['avgScrollDepth'] = df['avgScrollDepth'].fillna(0)
        # Safe division for click rate
        features_df['clickRate'] = (df['totalClicks'].fillna(0) / df['pageViews'].replace(0, 1).fillna(1))
        features_df['totalTimeSpent_minutes'] = df['totalTimeSpent'].fillna(0) / 60
        features_df['pageViews'] = df['pageViews'].fillna(0)
        features_df['pagesVisited_count'] = df['pagesVisited'].apply(lambda x: len(x) if isinstance(x, list) else 0)
        
        # Also copy over original columns needed for filtering and analysis
        features_df['totalClicks'] = df['totalClicks']
        features_df['totalTimeSpent'] = df['totalTimeSpent']

        return features_df

    def _find_optimal_clusters(self, X: np.ndarray) -> int:
        """
        Find optimal number of clusters using silhouette score, with safeguards.
        """
        # The number of clusters cannot exceed the number of samples
        n_samples = X.shape[0]
        # At least 2 clusters are needed for silhouette score
        if n_samples < 2:
            return 1

        max_k = min(self.max_clusters + 1, n_samples)
        min_k = min(self.min_clusters, max_k -1)
        
        if min_k < 2:
             min_k = 2
        
        k_range = range(min_k, max_k)

        if not k_range:
            return 1

        best_score = -1
        best_k = min_k
        
        for k in k_range:
            try:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
                labels = kmeans.fit_predict(X)
                
                # Silhouette score requires at least 2 clusters and samples
                if len(np.unique(labels)) > 1:
                    score = silhouette_score(X, labels)
                    if score > best_score:
                        best_score = score
                        best_k = k
            except ValueError:
                # This can happen in edge cases, e.g., with degenerate data.
                continue
        
        return best_k

    def _analyze_clusters(self, df: pd.DataFrame, labels: np.ndarray) -> Dict[int, Dict]:
        """
        Analyze each cluster and generate persona information.
        """
        df['cluster'] = labels
        clusters = {}
        
        # Handle the case of a single cluster fallback
        if self.optimal_k is None:
             self.optimal_k = len(np.unique(labels))
        
        for cluster_id in range(self.optimal_k):
            cluster_data = df[df['cluster'] == cluster_id]
            
            if cluster_data.empty:
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
            name, description = self._generate_persona_info(metrics, behavior_pattern, is_single_cluster=self.optimal_k == 1)
            
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
        all_pages = [page for pages in cluster_data['pagesVisited'] if pages for page in pages]
        if not all_pages:
            return []
        
        return pd.Series(all_pages).value_counts().head(5).index.tolist()

    def _get_common_devices(self, cluster_data: pd.DataFrame) -> List[str]:
        """Get most common devices"""
        devices = cluster_data['device'].apply(lambda x: x.get('type', 'unknown') if isinstance(x, dict) else 'unknown')
        return devices.value_counts().head(3).index.tolist()

    def _determine_behavior(self, metrics: Dict) -> Dict[str, bool]:
        """Determine behavior patterns"""
        common_pages_str = "".join(metrics.get("common_pages", [])).lower()
        return {
            "exploreMore": metrics["avg_page_views"] > 3,
            "quickDecision": metrics["avg_time_spent"] < 60,
            "priceConscious": "pricing" in common_pages_str,
            "featureFocused": metrics["avg_scroll_depth"] > 0.7
        }

    def _generate_persona_info(self, metrics: Dict, behavior: Dict, is_single_cluster: bool = False) -> tuple:
        """Generate persona name and description"""
        if is_single_cluster:
            return "General Audience", "A general group of users representing the average visitor."

        if behavior["quickDecision"] and behavior["priceConscious"]:
            return "Budget Buyer", "Quick decision-makers focused on price and value."
        elif behavior["exploreMore"] and behavior["featureFocused"]:
            return "Feature Explorer", "Thorough researchers who dive deep into product features."
        elif metrics["avg_time_spent"] > 180:
            return "Careful Researcher", "Takes time to evaluate all options before deciding."
        elif behavior["quickDecision"]:
            return "Impulse Buyer", "Quick to decide with high engagement."
        else:
            return "Casual Visitor", "Browsing without immediate purchase intent."

    def _extract_characteristics(self, metrics: Dict, behavior: Dict) -> List[str]:
        """Extract persona characteristics"""
        characteristics = []
        if metrics.get("avg_time_spent", 0) > 120: characteristics.append("High engagement")
        if metrics.get("avg_scroll_depth", 0) > 0.7: characteristics.append("Thorough reader")
        if behavior.get("quickDecision"): characteristics.append("Quick decision maker")
        if behavior.get("priceConscious"): characteristics.append("Price conscious")
        if metrics.get("avg_page_views", 0) > 4: characteristics.append("Multi-page explorer")
        if not characteristics: characteristics.append("General browsing")
        return characteristics