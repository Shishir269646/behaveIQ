module.exports = {
  PERSONA_TYPES: [
    'budget_buyer',
    'feature_explorer',
    'careful_researcher',
    'impulse_buyer',
    'casual_visitor'
  ],
  
  EMOTION_TYPES: [
    'frustrated',
    'confused',
    'excited',
    'neutral',
    'considering'
  ],

  INTENT_THRESHOLDS: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80
  },

  FRAUD_RISK_LEVELS: {
    LOW: 40,
    MEDIUM: 60,
    HIGH: 80
  },

  CACHE_TTL: {
    USER: 3600,        // 1 hour
    SESSION: 1800,     // 30 minutes
    EMOTION: 300,      // 5 minutes
    INTENT: 600        // 10 minutes
  }
};