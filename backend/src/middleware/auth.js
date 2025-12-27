const auth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // Validate API key (implement your logic)
    if (apiKey !== process.env.API_KEY) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = auth;