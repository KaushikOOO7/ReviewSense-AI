"""Review tokenization and sequence padding shared by training and inference.

The preferred data source is ``tf.keras.datasets.imdb``. Its reviews are already
integer encoded, so we save the matching IMDB word index and use that exact map
for free-text inference. An optional raw ACL IMDb directory can also be used for
offline experiments; in that mode a Keras Tokenizer is fitted on the training
reviews and its vocabulary/configuration is saved in the same artifact format.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

import numpy as np

from .config import MAXLEN, NUM_WORDS

# This matches the default filters used by keras.preprocessing.text.Tokenizer.
KERAS_FILTERS = '"!#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n'


def normalize_text(text: str, *, lower: bool = True, filters: str = KERAS_FILTERS) -> list[str]:
    """Split text the same way as the default Keras Tokenizer does."""
    if lower:
        text = text.lower()
    if filters:
        text = text.translate(str.maketrans({character: " " for character in filters}))
    return text.split(" ")


def make_imdb_artifact(word_index: Mapping[str, int]) -> dict[str, Any]:
    """Create an inference vocabulary matching Keras' pre-indexed IMDB dataset.

    Keras reserves ids 0, 1, and 2 for padding, start-of-review, and OOV. The
    public word index starts at 1, so the IMDB loader offsets every word by 3.
    Keeping only ids below ``NUM_WORDS`` is both sufficient and safe for the
    model's embedding table.
    """
    vocab: dict[str, int] = {}
    for word, raw_index in word_index.items():
        index = int(raw_index) + 3
        if 3 <= index < NUM_WORDS:
            vocab[str(word)] = index
    return {
        "format_version": 1,
        "kind": "keras_imdb",
        "num_words": NUM_WORDS,
        "maxlen": MAXLEN,
        "word_index": vocab,
        "lower": True,
        "filters": KERAS_FILTERS,
        "start_index": 1,
        "oov_index": 2,
    }


def make_tokenizer_artifact(
    word_index: Mapping[str, int],
    *,
    filters: str = KERAS_FILTERS,
    lower: bool = True,
    split: str = " ",
    oov_token: str = "<OOV>",
) -> dict[str, Any]:
    """Save the configuration and vocabulary from a fitted Keras Tokenizer."""
    safe_index = {
        str(word): int(index)
        for word, index in word_index.items()
        if int(index) < NUM_WORDS
    }
    return {
        "format_version": 1,
        "kind": "keras_tokenizer",
        "num_words": NUM_WORDS,
        "maxlen": MAXLEN,
        "word_index": safe_index,
        "lower": bool(lower),
        "filters": str(filters),
        "split": str(split),
        "oov_token": str(oov_token),
        "oov_index": int(safe_index.get(oov_token, 1)),
    }


def tokenize_review(text: str, artifact: Mapping[str, Any]) -> list[int]:
    """Convert a review into the exact integer sequence used by the model."""
    if not isinstance(text, str):
        raise TypeError("review must be a string")

    vocabulary = artifact.get("word_index")
    if not isinstance(vocabulary, Mapping):
        raise ValueError("Tokenizer artifact is missing its word_index")

    num_words = int(artifact.get("num_words", NUM_WORDS))
    kind = artifact.get("kind")

    if kind == "keras_imdb":
        oov_index = int(artifact.get("oov_index", 2))
        tokens = normalize_text(
            text,
            lower=bool(artifact.get("lower", True)),
            filters=str(artifact.get("filters", KERAS_FILTERS)),
        )
        # ``load_data`` prepends the same START token to every IMDb review.
        sequence = [int(artifact.get("start_index", 1))]
        for token in tokens:
            if not token:
                continue
            index = vocabulary.get(token)
            index = int(index) if index is not None else oov_index
            sequence.append(index if 0 <= index < num_words else oov_index)
        return sequence

    if kind == "keras_tokenizer":
        split = str(artifact.get("split", " "))
        normalized = text.lower() if artifact.get("lower", True) else text
        filters = str(artifact.get("filters", KERAS_FILTERS))
        if filters:
            normalized = normalized.translate(
                str.maketrans({character: split for character in filters})
            )
        tokens = normalized.split(split) if split else list(normalized)
        oov_index = int(artifact.get("oov_index", 1))
        sequence = []
        for token in tokens:
            if not token:
                continue
            index = vocabulary.get(token)
            index = int(index) if index is not None else oov_index
            sequence.append(index if 0 <= index < num_words else oov_index)
        return sequence

    raise ValueError(f"Unsupported tokenizer artifact kind: {kind!r}")


def pad_sequences(
    sequences: Iterable[Sequence[int]],
    *,
    maxlen: int = MAXLEN,
    num_words: int = NUM_WORDS,
    oov_index: int = 2,
    dtype: np.dtype[Any] | type = np.int32,
) -> np.ndarray:
    """Pad before each sequence and truncate from its beginning, as Keras does.

    Values outside the embedding vocabulary are replaced by the appropriate
    OOV index for the saved vocabulary rather than being allowed into Embedding.
    """
    if maxlen <= 0:
        raise ValueError("maxlen must be greater than zero")
    if num_words <= 0:
        raise ValueError("num_words must be greater than zero")

    rows = list(sequences)
    output = np.zeros((len(rows), maxlen), dtype=dtype)
    for row_index, sequence in enumerate(rows):
        values = [int(value) for value in sequence]
        if values:
            # Padding is zero in both modes. Use the exact OOV id paired with
            # the saved vocabulary before values reach the Embedding layer.
            if not 0 < oov_index < num_words:
                raise ValueError("oov_index must be within the embedding vocabulary")
            values = [value if 0 <= value < num_words else oov_index for value in values]
            values = values[-maxlen:]
            output[row_index, -len(values) :] = values
    return output


def save_tokenizer_artifact(path: Path, artifact: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(artifact, ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)


def load_tokenizer_artifact(path: Path) -> dict[str, Any]:
    artifact = json.loads(path.read_text(encoding="utf-8"))
    if artifact.get("format_version") != 1:
        raise ValueError("Unsupported tokenizer artifact version")
    if int(artifact.get("num_words", 0)) != NUM_WORDS:
        raise ValueError(f"Tokenizer vocabulary must have num_words={NUM_WORDS}")
    if int(artifact.get("maxlen", 0)) != MAXLEN:
        raise ValueError(f"Tokenizer sequence length must have maxlen={MAXLEN}")
    if not isinstance(artifact.get("word_index"), dict):
        raise ValueError("Tokenizer artifact has no vocabulary")
    return artifact


def validate_sequences(
    sequences: np.ndarray,
    *,
    num_words: int = NUM_WORDS,
    maxlen: int = MAXLEN,
) -> None:
    """Fail early if shape or any id is outside the embedding's input range."""
    if sequences.ndim != 2:
        raise ValueError(f"Expected a 2D padded array, received shape {sequences.shape}")
    if sequences.shape[1] != maxlen:
        raise ValueError(f"Expected padded sequence length {maxlen}, got {sequences.shape[1]}")
    if sequences.size and (int(sequences.min()) < 0 or int(sequences.max()) >= num_words):
        raise ValueError("Found token indices outside the embedding vocabulary")


def sanitize_imdb_sequences(sequences: Iterable[Sequence[int]]) -> list[list[int]]:
    """Replace out-of-range Keras IMDB ids with its reserved OOV id (2)."""
    sanitized = []
    for sequence in sequences:
        sanitized.append(
            [int(value) if 0 <= int(value) < NUM_WORDS else 2 for value in sequence]
        )
    return sanitized
