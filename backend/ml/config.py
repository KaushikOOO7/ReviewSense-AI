"""Shared ML configuration. Values are environment-configurable for training."""

from __future__ import annotations

import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent

NUM_WORDS = 10_000
MAXLEN = 50
EMBEDDING_DIM = 2
RNN_UNITS = 32
SEED = int(os.getenv("REVIEWSENSE_SEED", "42"))


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


DEVELOPMENT_MODE = env_bool("DEVELOPMENT_MODE", True)
DEV_TRAIN_SAMPLES = int(os.getenv("DEV_TRAIN_SAMPLES", "5000"))
DEV_TEST_SAMPLES = int(os.getenv("DEV_TEST_SAMPLES", "1000"))
DEV_EPOCHS = int(os.getenv("DEV_EPOCHS", "3"))
FULL_EPOCHS = int(os.getenv("FULL_EPOCHS", "5"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "128"))
VALIDATION_SPLIT = float(os.getenv("VALIDATION_SPLIT", "0.2"))

MODELS_DIR = Path(os.getenv("REVIEWSENSE_MODELS_DIR", str(BACKEND_DIR / "models")))
ARTIFACTS_DIR = Path(
    os.getenv("REVIEWSENSE_ARTIFACTS_DIR", str(BACKEND_DIR / "artifacts"))
)
TOKENIZER_PATH = ARTIFACTS_DIR / "tokenizer.json"
METRICS_PATH = ARTIFACTS_DIR / "model_metrics.json"

MODEL_NAMES = {
    "simple_rnn": "SimpleRNN",
    "lstm": "LSTM",
    "gru": "GRU",
}
MODEL_FILES = {key: MODELS_DIR / f"{key}.keras" for key in MODEL_NAMES}
