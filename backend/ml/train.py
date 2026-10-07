"""Train and evaluate the SimpleRNN, LSTM, and GRU IMDB classifiers.

Default source: ``tf.keras.datasets.imdb`` (the official pre-indexed Keras
IMDB dataset). For offline reproducibility, ``--dataset-source acl-imdb`` reads
the canonical Large Movie Review Dataset directory (aclImdb/train and /test)
and fits a Keras Tokenizer on its training reviews.

Examples:
    DEVELOPMENT_MODE=True python -m backend.ml.train
    DEVELOPMENT_MODE=False python -m backend.ml.train
    python -m backend.ml.train --dataset-source acl-imdb --reviews-dir ./data/aclImdb
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Any

import numpy as np

from .config import (
    ARTIFACTS_DIR,
    BATCH_SIZE,
    DEVELOPMENT_MODE,
    DEV_EPOCHS,
    DEV_TEST_SAMPLES,
    DEV_TRAIN_SAMPLES,
    EMBEDDING_DIM,
    FULL_EPOCHS,
    MAXLEN,
    METRICS_PATH,
    MODEL_FILES,
    MODEL_NAMES,
    MODELS_DIR,
    NUM_WORDS,
    RNN_UNITS,
    SEED,
    TOKENIZER_PATH,
    VALIDATION_SPLIT,
)
from .preprocessing import (
    make_imdb_artifact,
    make_tokenizer_artifact,
    pad_sequences,
    sanitize_imdb_sequences,
    save_tokenizer_artifact,
    validate_sequences,
)


def _tensorflow():
    try:
        import tensorflow as tf
    except ImportError as exc:  # pragma: no cover - depends on user's environment
        raise RuntimeError(
            "TensorFlow is required for training. Install backend/requirements.txt first."
        ) from exc
    return tf


def _read_acl_imdb_split(root: Path, split: str) -> tuple[list[str], np.ndarray]:
    """Read labeled review text from the standard aclImdb folder layout."""
    candidates = [root, root / "aclImdb"]
    dataset_root = next((candidate for candidate in candidates if (candidate / split).is_dir()), None)
    if dataset_root is None:
        raise FileNotFoundError(
            f"Could not find {split}/pos and {split}/neg under {root}. "
            "Pass the aclImdb directory or its parent with --reviews-dir."
        )

    texts: list[str] = []
    labels: list[int] = []
    for label_name, label in (("neg", 0), ("pos", 1)):
        review_dir = dataset_root / split / label_name
        if not review_dir.is_dir():
            raise FileNotFoundError(f"Missing labeled review directory: {review_dir}")
        for review_path in sorted(review_dir.glob("*.txt")):
            texts.append(review_path.read_text(encoding="utf-8", errors="replace"))
            labels.append(label)
    if not texts:
        raise ValueError(f"No labeled reviews found for split {split!r} under {dataset_root}")
    return texts, np.asarray(labels, dtype=np.int32)


def _load_acl_imdb(reviews_dir: Path) -> tuple[list[list[int]], np.ndarray, list[list[int]], np.ndarray, dict[str, Any]]:
    """Fit a Keras Tokenizer on the training corpus and encode both splits."""
    tf = _tensorflow()
    from tensorflow.keras.preprocessing.text import Tokenizer

    train_texts, train_labels = _read_acl_imdb_split(reviews_dir, "train")
    test_texts, test_labels = _read_acl_imdb_split(reviews_dir, "test")

    tokenizer = Tokenizer(num_words=NUM_WORDS, oov_token="<OOV>")
    tokenizer.fit_on_texts(train_texts)
    train_sequences = tokenizer.texts_to_sequences(train_texts)
    test_sequences = tokenizer.texts_to_sequences(test_texts)
    artifact = make_tokenizer_artifact(
        tokenizer.word_index,
        filters=tokenizer.filters,
        lower=tokenizer.lower,
        split=tokenizer.split,
        oov_token=tokenizer.oov_token or "<OOV>",
    )
    print(
        f"Loaded {len(train_texts):,} training and {len(test_texts):,} test reviews "
        f"from {reviews_dir}; tokenizer contains {len(artifact['word_index']):,} in-range words."
    )
    return train_sequences, train_labels, test_sequences, test_labels, artifact


def _load_keras_imdb() -> tuple[list[list[int]], np.ndarray, list[list[int]], np.ndarray, dict[str, Any]]:
    """Load the official pre-indexed Keras IMDB corpus and its matching vocabulary."""
    tf = _tensorflow()
    (x_train, y_train), (x_test, y_test) = tf.keras.datasets.imdb.load_data(
        num_words=NUM_WORDS
    )
    word_index = tf.keras.datasets.imdb.get_word_index()
    artifact = make_imdb_artifact(word_index)
    train_sequences = sanitize_imdb_sequences(x_train)
    test_sequences = sanitize_imdb_sequences(x_test)
    print(
        f"Loaded the Keras IMDB dataset: {len(train_sequences):,} training and "
        f"{len(test_sequences):,} test reviews; {len(artifact['word_index']):,} "
        "in-range vocabulary entries."
    )
    return (
        train_sequences,
        np.asarray(y_train, dtype=np.int32),
        test_sequences,
        np.asarray(y_test, dtype=np.int32),
        artifact,
    )


def _sample_split(
    sequences: list[list[int]],
    labels: np.ndarray,
    sample_count: int | None,
    rng: np.random.Generator,
) -> tuple[list[list[int]], np.ndarray]:
    if sample_count is None or sample_count >= len(sequences):
        return sequences, labels
    if sample_count < 1:
        raise ValueError("Sample counts must be greater than zero")
    indices = rng.choice(len(sequences), size=sample_count, replace=False)
    return [sequences[int(i)] for i in indices], labels[indices]


def build_model(model_key: str):
    """Build one of the requested recurrent baselines with the shared embedding."""
    tf = _tensorflow()
    if model_key not in MODEL_NAMES:
        raise ValueError(f"Unknown model key: {model_key}")

    recurrent_layer = {
        "simple_rnn": tf.keras.layers.SimpleRNN,
        "lstm": tf.keras.layers.LSTM,
        "gru": tf.keras.layers.GRU,
    }[model_key]
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(MAXLEN,), dtype="int32", name="review_tokens"),
            tf.keras.layers.Embedding(
                input_dim=NUM_WORDS,
                output_dim=EMBEDDING_DIM,
                mask_zero=True,
                name="word_embedding",
            ),
            recurrent_layer(RNN_UNITS, name=model_key),
            tf.keras.layers.Dense(1, activation="sigmoid", name="sentiment_probability"),
        ],
        name=f"reviewsense_{model_key}",
    )
    model.compile(
        optimizer=tf.keras.optimizers.Adam(),
        loss="binary_crossentropy",
        metrics=[tf.keras.metrics.BinaryAccuracy(name="accuracy")],
    )
    return model


def _atomic_json(path: Path, contents: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(contents, indent=2), encoding="utf-8")
    temporary.replace(path)


def train(
    *,
    development_mode: bool = DEVELOPMENT_MODE,
    dataset_source: str = "keras",
    reviews_dir: Path | None = None,
    epochs: int | None = None,
    train_samples: int | None = None,
    test_samples: int | None = None,
) -> dict[str, Any]:
    """Train all three RNN variants and persist models, tokenizer, and metrics."""
    tf = _tensorflow()
    random.seed(SEED)
    np.random.seed(SEED)
    tf.keras.utils.set_random_seed(SEED)

    if dataset_source == "acl-imdb":
        if reviews_dir is None:
            raise ValueError("--reviews-dir is required with --dataset-source acl-imdb")
        data = _load_acl_imdb(reviews_dir)
        dataset_label = "ACL IMDb Large Movie Review Dataset"
    elif dataset_source == "keras":
        data = _load_keras_imdb()
        dataset_label = "Keras IMDB"
    else:
        raise ValueError(f"Unsupported dataset source: {dataset_source}")

    x_train_sequences, y_train, x_test_sequences, y_test, tokenizer_artifact = data
    rng = np.random.default_rng(SEED)
    if development_mode:
        actual_train_samples = min(train_samples or DEV_TRAIN_SAMPLES, len(x_train_sequences))
        actual_test_samples = min(test_samples or DEV_TEST_SAMPLES, len(x_test_sequences))
        actual_epochs = epochs or DEV_EPOCHS
    else:
        actual_train_samples = None
        actual_test_samples = None
        actual_epochs = epochs or FULL_EPOCHS

    x_train_sequences, y_train = _sample_split(
        x_train_sequences, y_train, actual_train_samples, rng
    )
    x_test_sequences, y_test = _sample_split(
        x_test_sequences, y_test, actual_test_samples, rng
    )
    # The raw ACL directory is class-grouped on disk (negative files followed
    # by positive files). Shuffle before Keras' validation_split so validation
    # contains both classes rather than a class-specific tail partition.
    train_order = rng.permutation(len(x_train_sequences))
    x_train_sequences = [x_train_sequences[int(index)] for index in train_order]
    y_train = y_train[train_order]
    oov_index = int(tokenizer_artifact.get("oov_index", 2))
    x_train = pad_sequences(
        x_train_sequences,
        num_words=NUM_WORDS,
        oov_index=oov_index,
    )
    x_test = pad_sequences(
        x_test_sequences,
        num_words=NUM_WORDS,
        oov_index=oov_index,
    )
    validate_sequences(x_train)
    validate_sequences(x_test)
    y_train = np.asarray(y_train, dtype=np.float32)
    y_test = np.asarray(y_test, dtype=np.float32)

    if len(x_train) < 2:
        raise ValueError("At least two training reviews are required")
    if not 0.0 < VALIDATION_SPLIT < 1.0:
        raise ValueError("VALIDATION_SPLIT must be between 0 and 1")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    save_tokenizer_artifact(TOKENIZER_PATH, tokenizer_artifact)

    config: dict[str, Any] = {
        "dataset": dataset_label,
        "dataset_source": dataset_source,
        "development_mode": bool(development_mode),
        "training_samples": len(x_train),
        "test_samples": len(x_test),
        "epochs": int(actual_epochs),
        "batch_size": BATCH_SIZE,
        "validation_split": VALIDATION_SPLIT,
        "num_words": NUM_WORDS,
        "maxlen": MAXLEN,
        "embedding_dim": EMBEDDING_DIM,
        "rnn_units": RNN_UNITS,
        "seed": SEED,
    }
    metrics: dict[str, Any] = {
        "format_version": 1,
        "dataset": dataset_label,
        "training_config": config,
        "best_model": None,
        "models": [],
    }
    _atomic_json(METRICS_PATH, metrics)

    result_by_key: dict[str, dict[str, Any]] = {}
    for model_index, model_key in enumerate(MODEL_NAMES):
        print(f"\nTraining {MODEL_NAMES[model_key]} ({model_index + 1}/3)")
        tf.keras.backend.clear_session()
        tf.keras.utils.set_random_seed(SEED + model_index)
        model = build_model(model_key)

        started_at = time.perf_counter()
        history = model.fit(
            x_train,
            y_train,
            validation_split=VALIDATION_SPLIT,
            epochs=actual_epochs,
            batch_size=BATCH_SIZE,
            shuffle=True,
            verbose=2,
        )
        training_seconds = time.perf_counter() - started_at
        evaluation = model.evaluate(x_test, y_test, batch_size=BATCH_SIZE, verbose=0)
        metric_names = model.metrics_names
        evaluated = dict(zip(metric_names, evaluation))
        # Keras versions can expose loss/compile_metrics differently. Binary
        # accuracy is calculated from the actual test predictions as a stable fallback.
        test_accuracy = evaluated.get("accuracy")
        if test_accuracy is None:
            probabilities = model.predict(x_test, batch_size=BATCH_SIZE, verbose=0).reshape(-1)
            test_accuracy = float(np.mean((probabilities >= 0.5) == (y_test >= 0.5)))
        validation_accuracy = float(history.history["val_accuracy"][-1])

        model_path = MODEL_FILES[model_key]
        model.save(model_path)
        row: dict[str, Any] = {
            "key": model_key,
            "name": MODEL_NAMES[model_key],
            "accuracy": float(test_accuracy),
            "validation_accuracy": validation_accuracy,
            "training_seconds": float(training_seconds),
            "epochs": int(actual_epochs),
            "available": True,
        }
        result_by_key[model_key] = row
        metrics["models"] = list(result_by_key.values())
        metrics["best_model"] = max(
            result_by_key.values(), key=lambda item: item["validation_accuracy"]
        )["key"]
        _atomic_json(METRICS_PATH, metrics)
        print(
            f"{MODEL_NAMES[model_key]} — test accuracy {row['accuracy']:.4f}, "
            f"validation accuracy {validation_accuracy:.4f}, "
            f"training time {training_seconds:.1f}s"
        )
        del model

    print(f"\nSaved models in {MODELS_DIR}")
    print(f"Saved tokenizer and evaluation metrics in {ARTIFACTS_DIR}")
    print(f"Best validation model: {MODEL_NAMES[metrics['best_model']]}")
    return metrics


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--development-mode",
        dest="development_mode",
        action="store_true",
        help="Use the configured development subset (default).",
    )
    mode.add_argument(
        "--full",
        dest="development_mode",
        action="store_false",
        help="Train on every available train/test review.",
    )
    parser.set_defaults(development_mode=DEVELOPMENT_MODE)
    parser.add_argument(
        "--dataset-source",
        choices=("keras", "acl-imdb"),
        default=os.getenv("IMDB_DATA_SOURCE", "keras"),
        help="Use Keras' IMDB loader (default) or a local aclImdb directory.",
    )
    parser.add_argument(
        "--reviews-dir",
        type=Path,
        default=os.getenv("IMDB_REVIEWS_DIR"),
        help="Directory containing train/pos, train/neg, test/pos, and test/neg.",
    )
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--train-samples", type=int, default=None)
    parser.add_argument("--test-samples", type=int, default=None)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    reviews_dir = Path(args.reviews_dir) if args.reviews_dir else None
    try:
        train(
            development_mode=args.development_mode,
            dataset_source=args.dataset_source,
            reviews_dir=reviews_dir,
            epochs=args.epochs,
            train_samples=args.train_samples,
            test_samples=args.test_samples,
        )
    except (FileNotFoundError, RuntimeError, ValueError) as exc:
        print(f"Training failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
