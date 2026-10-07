# ReviewSense AI backend

FastAPI + TensorFlow/Keras service for real IMDB sentiment inference and recurrent-model training.

## Run the API

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate                 # Windows: .venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

At startup, the API reads `backend/artifacts/tokenizer.json` and loads each available `.keras` file once. It warms each network and validates its input/output dimensions. `/predict` only performs preprocessing and a forward pass. When an artifact is missing or corrupt, `/health` reports degraded readiness and `/predict` returns 503 rather than producing a placeholder result.

## Train or refresh models

The normal source is Keras' IMDB loader. Fast development defaults are controlled in `ml/config.py` and environment variables:

```bash
DEVELOPMENT_MODE=True python -m backend.ml.train
DEVELOPMENT_MODE=False python -m backend.ml.train
```

Development defaults are 5,000 train examples, 1,000 test examples, and 3 epochs. Full mode uses the complete IMDB splits and five epochs by default. The trainer evaluates each model, saves its weights, saves the tokenizer used for inference, and records accuracy, validation accuracy, elapsed `fit` time, and the selected best model.

An offline `aclImdb` directory can be supplied as a text source:

```bash
IMDB_DATA_SOURCE=acl-imdb IMDB_REVIEWS_DIR=/path/to/aclImdb \
  python -m backend.ml.train
```

The raw source must include `train/{pos,neg}` and `test/{pos,neg}` directories. Its Keras Tokenizer is fitted on the training text only. For both dataset paths, the model receives pre-padded/pre-truncated sequences of length 50 and every integer index is checked against the 10,000-entry embedding.

## API routes

- `GET /health` — process, model readiness, and preprocessing config.
- `GET /models` — availability and measured comparison data for SimpleRNN, LSTM, and GRU.
- `POST /predict` — JSON body with `review` and optional model key; output includes sentiment, class probabilities, confidence, and model identity.
- `GET /docs` — OpenAPI UI.

See the root README for schemas, setup, architecture, and known limitations.

## Test

```bash
.venv/bin/pytest -q
```
