import os
from typing import Dict, Any

class Config:
    """
    Configuration manager for ML service
    """
    
    @staticmethod
    def get_config() -> Dict[str, Any]:
        return {
            "server": {
                "host": os.getenv("HOST", "0.0.0.0"),
                "port": int(os.getenv("PORT", 8000))
            },
            "ml": {
                "min_clusters": int(os.getenv("MIN_CLUSTERS", 3)),
                "max_clusters": int(os.getenv("MAX_CLUSTERS", 6)),
                "clustering_algorithm": os.getenv("CLUSTERING_ALGORITHM", "kmeans")
            },
            "llm": {
                "provider": "openai",
                "model": "gpt-4",
                "api_key": os.getenv("OPENAI_API_KEY")
            },
            "cache": {
                "enabled": True,
                "ttl": 300  # 5 minutes
            }
        }

    @staticmethod
    def validate_config() -> bool:
        """
        Validate that all required config is present
        """
        required_vars = ["OPENAI_API_KEY"]
        
        for var in required_vars:
            if not os.getenv(var):
                print(f"Warning: {var} not set in environment")
                return False
        
        return True