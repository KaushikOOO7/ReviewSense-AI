import numpy as np
import pytest

from backend.ml.preprocessing import (
    make_imdb_artifact,
    make_tokenizer_artifact,
    pad_sequences,
    tokenize_review,
    validate_sequences,
)


def test_keras_imdb_vocabulary_uses_reserved_offsets_and_oov():
    artifact = make_imdb_artifact({"excellent": 1, "film": 2, "too_rare": 20_000})

    assert artifact["word_index"] == {"excellent": 4, "film": 5}
    assert tokenize_review("Excellent, film! unknown", artifact) == [1, 4, 5, 2]


def test_fitted_keras_tokenizer_keeps_keras_oov_id():
    artifact = make_tokenizer_artifact(
        {"<OOV>": 1, "great": 2, "movie": 3, "rare": 10_000}
    )

    assert tokenize_review("GREAT movie? unseen", artifact) == [2, 3, 1]


def test_padding_is_pre_padded_and_pre_truncated():
    values = pad_sequences([[3, 4, 5], list(range(1, 55))], maxlen=4)

    np.testing.assert_array_equal(values[0], [0, 3, 4, 5])
    np.testing.assert_array_equal(values[1], [51, 52, 53, 54])
    validate_sequences(values, maxlen=4)

    replaced = pad_sequences([[5, 10_000, 7]], maxlen=4, num_words=10, oov_index=1)
    np.testing.assert_array_equal(replaced, [[0, 5, 1, 7]])
    validate_sequences(replaced, num_words=10, maxlen=4)


def test_padding_and_vocabulary_validation_reject_invalid_configuration():
    with pytest.raises(ValueError, match="greater than zero"):
        pad_sequences([[1]], maxlen=0)
    with pytest.raises(ValueError, match="outside the embedding vocabulary"):
        validate_sequences(np.asarray([[0, 1, 10_000] + [0] * 47], dtype=np.int32))
