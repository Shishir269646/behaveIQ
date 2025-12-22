import hashlib
import json
from typing import Any, Dict

def hash_data(data: Any) -> str:
    """
    Create hash of data for caching
    """
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.md5(json_str.encode()).hexdigest()

def normalize_score(score: float, min_val: float = 0, max_val: float = 1) -> float:
    """
    Normalize score to 0-1 range
    """
    if max_val == min_val:
        return 0.0
    return max(0.0, min(1.0, (score - min_val) / (max_val - min_val)))

def calculate_confidence(values: list) -> float:
    """
    Calculate confidence score based on consistency of values
    """
    if len(values) < 2:
        return 0.5
    
    import numpy as np
    std = np.std(values)
    mean = np.mean(values)
    
    if mean == 0:
        return 0.5
    
    # Coefficient of variation
    cv = std / mean if mean != 0 else 1
    
    # Lower CV = higher confidence
    confidence = 1.0 - min(cv, 1.0)
    
    return max(0.5, confidence)

