# BEHAVEIQ ML Service

Machine Learning microservice for user behavior analysis and personalization.

## Features

- User persona discovery using clustering
- Intent prediction
- Content recommendations
- LLM-powered content generation
- Confusion zone detection

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Run service:
```bash
python -m app.main
```

Or with uvicorn directly:
```bash
uvicorn app.main:app --reload --port 8000
```

## Docker

Build and run:
```bash
docker build -t behaveiq-ml .
docker run -p 8000:8000 --env-file .env behaveiq-ml
```

## API Endpoints

- POST `/ml/v1/clustering/discover-personas` - Discover user personas
- POST `/ml/v1/intent/predict` - Predict purchase intent
- POST `/ml/v1/recommendations/content` - Get content recommendations
- POST `/ml/v1/llm/generate-content` - Generate content with LLM
- POST `/ml/v1/analysis/confusion-detection` - Detect confusion zones
- GET `/ml/v1/models/status` - Check model status

## Testing

```bash
curl http://localhost:8000/health