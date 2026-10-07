"""Load saved models once and serve real inference without training."""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

import numpy as np

from .config import (
    ARTIFACTS_DIR,
    MAXLEN,
    MODEL_NAMES,
    MODELS_DIR,
    NUM_WORDS,
)
from .preprocessing import load_tokenizer_artifact, pad_sequences, tokenize_review, validate_sequences


class ModelUnavailableError(RuntimeError):
    """Raised when a requested trained model is not ready to serve predictions."""


class SentimentPredictor:
    """In-memory registry for the saved recurrent classifiers.

    The models and preprocessing vocabulary are loaded once during FastAPI's
    lifespan startup. ``predict`` only tokenizes and runs a forward pass; it
    never downloads data, retrains, or fabricates prediction values.
    """

    def __init__(
        self,
        *,
        models_dir: Path = MODELS_DIR,
        artifacts_dir: Path = ARTIFACTS_DIR,
    ) -> None:
        self.models_dir = Path(models_dir)
        self.artifacts_dir = Path(artifacts_dir)
        self.models: dict[str, Any] = {}
        self.metrics: dict[str, Any] = {}
        self.tokenizer: dict[str, Any] | None = None
        self.error: str | None = None
        self.model_errors: dict[str, str] = {}
        self._lock = threading.RLock()

    @property
    def ready(self) -> bool:
        return bool(self.models and self.tokenizer)

    @property
    def best_model(self) -> str | None:
        candidate = self.metrics.get("best_model")
        if candidate in self.models:
            return str(candidate)
        rows = self.metrics.get("models", [])
        available = [row for row in rows if row.get("key") in self.models]
        if available:
            best = max(
                available,
                key=lambda row: float(row.get("validation_accuracy", -1.0)),
            )
            return str(best["key"])
        return next(iter(self.models), None)

    def load(self) -> None:
        """Load artifacts and warm all available networks once at startup."""
        try:
            self.tokenizer = load_tokenizer_artifact(self.artifacts_dir / "tokenizer.json")
        except Exception as exc:
            self.error = f"Could not load tokenizer: {exc}"
            return

        try:
            metrics_path = self.artifacts_dir / "model_metrics.json"
            if metrics_path.exists():
                self.metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
                if not isinstance(self.metrics, dict):
                    raise ValueError("metrics artifact must be a JSON object")
            else:
                self.metrics = {}
        except Exception as exc:
            self.error = f"Could not load model metrics: {exc}"
            self.metrics = {}

        available_paths = {
            key: self.models_dir / f"{key}.keras" for key in MODEL_NAMES
        }
        existing_paths = {key: path for key, path in available_paths.items() if path.is_file()}
        if not existing_paths:
            self.error = self.error or (
                f"No trained model files found in {self.models_dir}. "
                "Run `python -m backend.ml.train` to train the IMDB models."
            )
            return

        try:
            import tensorflow as tf
        except ImportError as exc:
            self.error = self.error or (
                "TensorFlow is not installed. Install backend/requirements.txt to load models."
            )
            return

        for model_key, path in existing_paths.items():
            try:
                model = tf.keras.models.load_model(path, compile=False)
                input_shape = tuple(model.input_shape)
                output_shape = tuple(model.output_shape)
                if len(input_shape) != 2 or input_shape[-1] != MAXLEN:
                    raise ValueError(f"expected input shape (None, {MAXLEN}), got {input_shape}")
                if len(output_shape) != 2 or output_shape[-1] != 1:
                    raise ValueError(f"expected a single probability output, got {output_shape}")
                warmup = np.zeros((1, MAXLEN), dtype=np.int32)
                output = np.asarray(model(warmup, training=False)).reshape(-1)
                if output.size != 1 or not np.isfinite(output[0]):
                    raise ValueError("model warm-up returned an invalid output")
                self.models[model_key] = model
            except Exception as exc:
                self.model_errors[model_key] = str(exc)

        if not self.models:
            detail = "; ".join(f"{key}: {error}" for key, error in self.model_errors.items())
            self.error = self.error or f"No model could be loaded ({detail})"
            return

        if self.error is None:
            self.error = None

    def public_models(self) -> dict[str, Any]:
        """Return evaluated model metadata without exposing local file paths."""
        metric_by_key: dict[str, dict[str, Any]] = {}
        for row in self.metrics.get("models", []):
            if isinstance(row, dict) and row.get("key"):
                metric_by_key[str(row["key"])] = row

        models = []
        for model_key, name in MODEL_NAMES.items():
            row = metric_by_key.get(model_key, {})
            models.append(
                {
                    "key": model_key,
                    "name": name,
                    "accuracy": _optional_float(row.get("accuracy")),
                    "validation_accuracy": _optional_float(row.get("validation_accuracy")),
                    "training_seconds": _optional_float(row.get("training_seconds")),
                    "epochs": row.get("epochs"),
                    "available": model_key in self.models,
                    "status": "ready" if model_key in self.models else "not_trained",
                    "is_best": model_key == self.best_model,
                }
            )
        return {
            "models": models,
            "best_model": self.best_model,
            "selected_model": self.best_model,
            "dataset": self.metrics.get("dataset"),
            "training_config": self.metrics.get("training_config", {}),
            "ready": self.ready,
        }

    def predict(self, review: str, model_key: str | None = None) -> dict[str, Any]:
        if not self.ready:
            raise ModelUnavailableError(
                self.error or "No trained model is available. Train the models before predicting."
            )
        selected = model_key or self.best_model
        if selected not in MODEL_NAMES:
            raise ValueError(f"Unknown model. Choose one of: {', '.join(MODEL_NAMES)}")
        if selected not in self.models:
            raise ModelUnavailableError(
                f"{MODEL_NAMES[selected]} is not available. Train that model before selecting it."
            )

        assert self.tokenizer is not None
        sequence = tokenize_review(review, self.tokenizer)
        values = pad_sequences(
            [sequence],
            maxlen=MAXLEN,
            num_words=NUM_WORDS,
            oov_index=int(self.tokenizer.get("oov_index", 2)),
            dtype=np.int32,
        )
        validate_sequences(values)

        # Some TensorFlow runtimes share mutable execution state. Serializing the
        # small forward pass keeps requests safe under concurrent web traffic.
        with self._lock:
            output = self.models[selected](values, training=False)
            positive_probability = float(np.asarray(output).reshape(-1)[0])
        if not np.isfinite(positive_probability):
            raise RuntimeError("The selected model returned a non-finite probability")
        positive_probability = min(1.0, max(0.0, positive_probability))
        negative_probability = 1.0 - positive_probability
        confidence = max(positive_probability, negative_probability) * 100.0

        return {
            "sentiment": "Positive" if positive_probability >= 0.5 else "Negative",
            "confidence": round(confidence, 1),
            "positive_probability": round(positive_probability, 4),
            "negative_probability": round(negative_probability, 4),
            "model": selected,
            "model_name": MODEL_NAMES[selected],
        }


def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return numeric if np.isfinite(numeric) else None
