"""FastAPI application for ReviewSense AI."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.ml.config import MAXLEN, MODEL_NAMES, NUM_WORDS
from backend.ml.predict import ModelUnavailableError, SentimentPredictor


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("reviewsense")


class PredictionRequest(BaseModel):
    """Validated prediction payload."""

    model_config = ConfigDict(str_strip_whitespace=True)

    review: Annotated[str, Field(min_length=1, max_length=20_000)]
    model: Literal["simple_rnn", "lstm", "gru"] | None = None

    @field_validator("review")
    @classmethod
    def review_must_contain_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Review cannot be empty or whitespace only")
        return value


class PredictionResponse(BaseModel):
    sentiment: Literal["Positive", "Negative"]
    confidence: float = Field(ge=50.0, le=100.0)
    positive_probability: float = Field(ge=0.0, le=1.0)
    negative_probability: float = Field(ge=0.0, le=1.0)
    model: str
    model_name: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor = SentimentPredictor()
    predictor.load()
    app.state.predictor = predictor
    if predictor.ready:
        logger.info(
            "Loaded %d trained model(s); selected model is %s",
            len(predictor.models),
            predictor.best_model,
        )
    else:
        logger.warning("ML models are not ready: %s", predictor.error)
    yield


app = FastAPI(
    title="ReviewSense AI",
    description=(
        "Real IMDB-trained recurrent neural network sentiment analysis. "
        "Models are loaded once at startup; prediction requests never train."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "REVIEWSENSE_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://[\w.-]+\.e2b\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def get_predictor(request: Request) -> SentimentPredictor:
    predictor = getattr(request.app.state, "predictor", None)
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The model service has not finished initializing.",
        )
    return predictor


@app.get("/", tags=["service"])
def root() -> dict[str, str]:
    return {
        "service": "ReviewSense AI",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["service"])
def health(request: Request) -> dict[str, object]:
    predictor = get_predictor(request)
    return {
        "status": "ok" if predictor.ready else "degraded",
        "backend": "ReviewSense AI API",
        "ml_ready": predictor.ready,
        "models_loaded": len(predictor.models),
        "best_model": predictor.best_model,
        "model_error": predictor.error,
        "num_words": NUM_WORDS,
        "maxlen": MAXLEN,
    }


@app.get("/models", tags=["models"])
def models(request: Request) -> dict[str, object]:
    """Return measured evaluation results and which saved models are loadable."""
    return get_predictor(request).public_models()


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
def predict(payload: PredictionRequest, request: Request) -> PredictionResponse:
    """Predict sentiment with the selected persisted model; never trains here."""
    predictor = get_predictor(request)
    if not predictor.ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                predictor.error
                or "No trained model is available. Run `python -m backend.ml.train` first."
            ),
        )
    try:
        result = predictor.predict(payload.review, payload.model)
    except ModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:  # Guard the API boundary; details stay in server logs.
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The model could not analyze this review. Please try again.",
        ) from exc
    return PredictionResponse(**result)
