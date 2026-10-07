# ReviewSense AI

A responsive sentiment-analysis workspace backed by **real TensorFlow/Keras recurrent models**. ReviewSense predicts Positive or Negative sentiment from movie and product review text, returns the model's sigmoid probabilities and confidence, and compares measured SimpleRNN, LSTM, and GRU performance.

The repository includes trained model artifacts, so the API can serve predictions immediately after installing the backend requirements. The default training command uses Keras' official IMDB dataset; a local ACL IMDb directory is also supported as an offline text source.

## What is included

- **Review analyzer** with model selection, input validation, probability visualization, confidence, and live text statistics.
- **Model Arena** with real test accuracy, validation accuracy, and training time from the saved evaluation report. The best model is calculated from validation accuracy; results are not simulated or hardcoded in the UI.
- **Analysis history** stored locally in the browser, with clear and re-analyze actions.
- **Dark and light themes**, responsive layouts, API status, examples, and loading/error states.
- **FastAPI API** that loads saved Keras models once at startup. `/predict` only preprocesses and runs inference; it never trains.
- **Three trained architectures** using the requested 10,000-token vocabulary, 50-token sequences, 2-dimensional embedding, 32 recurrent units, and sigmoid binary output.

## Project architecture

```text
ReviewSense-AI/
├── backend/
│   ├── main.py                    # FastAPI routes, request validation, lifespan
│   ├── models/                    # Persisted SimpleRNN, LSTM, and GRU .keras weights
│   ├── artifacts/
│   │   ├── tokenizer.json         # Inference vocabulary and preprocessing settings
│   │   └── model_metrics.json     # Measured evaluation metrics and selected model
│   ├── ml/
│   │   ├── config.py              # Shared model/training configuration
│   │   ├── preprocessing.py       # Tokenization, vocabulary bounds, padding
│   │   ├── train.py               # Dataset loading, training, evaluation, saving
│   │   └── predict.py             # One-time model loading and inference
│   ├── tests/                     # Preprocessing and API contract tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/            # Sidebar, analyzer, result, Model Arena, history, cards
│   │   ├── data/                  # Model metadata and example reviews
│   │   ├── hooks/                 # Theme, API status, and local analysis history
│   │   ├── lib/                   # Formatting and review helpers
│   │   ├── pages/                 # Dashboard page composition
│   │   ├── services/              # API client
│   │   ├── test/                  # jsdom test setup
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── README.md
├── pytest.ini
└── README.md
```

### Request and training flow

```text
Browser (React + Vite)
  └─ /api/predict ── Vite dev proxy ──> FastAPI
                                        └─ loaded predictor
                                           ├─ saved tokenizer/vocabulary
                                           └─ selected .keras model

Training command
  └─ Keras IMDB dataset (default) or local ACL IMDb reviews
      → tokenization / integer sequences
      → pre-padding and pre-truncation to 50 tokens
      → Embedding(10000, 2)
      → SimpleRNN(32) / LSTM(32) / GRU(32)
      → Dense(1, sigmoid)
      → held-out evaluation and saved artifacts
```

## Setup

### Requirements

- Python 3.10–3.12 (TensorFlow CPU wheels are used)
- Node.js 20 or later and npm
- Approximately 1–2 GB free disk space for the Python environment and dataset cache during retraining

### 1. Start the backend

From the repository root:

```bash
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The bundled tokenizer and trained `.keras` files are loaded once during startup. Verify the service at:

- Health: <http://localhost:8000/health>
- Model metadata: <http://localhost:8000/models>
- Interactive API docs: <http://localhost:8000/docs>

If model artifacts are absent or cannot load, the API reports `ml_ready: false` and returns HTTP 503 for predictions rather than returning a placeholder result.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite serves the app on `0.0.0.0` and proxies browser requests under `/api` to the backend. The browser never needs to call `localhost` to reach a second service. For a separately deployed API, set `VITE_API_BASE_URL` to its API root (see `frontend/.env.example`).

### 3. Run tests and build

From the repository root:

```bash
.venv/bin/pytest -q                 # Windows: .venv\Scripts\pytest.exe -q
cd frontend
npm test                           # Vitest + Testing Library dashboard tests
npm run build
```

## ML pipeline

### Dataset and preprocessing

The default trainer calls `tf.keras.datasets.imdb.load_data(num_words=10000)` and obtains the matching word index from Keras. It applies the Keras IMDB reserved-token offset (`start=1`, `OOV=2`, words offset by 3), then saves the bounded vocabulary used for inference. The raw ACL IMDb source option is useful where the Keras data cache is unavailable; it fits a Keras `Tokenizer` on the training corpus and persists that exact vocabulary/configuration.

In both paths:

1. Reviews are tokenized with the saved vocabulary and OOV rules.
2. Out-of-range indices are mapped to the saved OOV token before reaching the embedding layer.
3. Sequences are **pre-padded and pre-truncated** to `maxlen=50` (same policy at training and inference).
4. Each model uses `Embedding(input_dim=10000, output_dim=2, mask_zero=True)` and 32 recurrent units.
5. `Dense(1, activation="sigmoid")` produces the positive-class probability. The negative probability is `1 - positive_probability`; the label threshold is 0.5. Reported confidence is the larger of the two class probabilities and is not a calibration guarantee.

The tokenizer and metrics are JSON artifacts; model weights are saved as `.keras` files. Inference loads these artifacts once on application startup. **No API request trains or downloads a model.**

### Training modes

Fast development mode is the default (`DEVELOPMENT_MODE=True`): 5,000 training examples, 1,000 test examples, and 3 epochs. These counts, epochs, batch size, seed, vocabulary size, and maximum sequence length are environment-configurable in `backend/ml/config.py`.

```bash
# Fast development run (the default)
DEVELOPMENT_MODE=True python -m backend.ml.train

# Full Keras IMDB training/test splits
DEVELOPMENT_MODE=False python -m backend.ml.train
# or explicitly:
python -m backend.ml.train --full
```

The Keras loader downloads its dataset and word-index files on the first run if they are not cached. To use a local copy of the standard `aclImdb` directory instead:

```bash
IMDB_DATA_SOURCE=acl-imdb \
IMDB_REVIEWS_DIR=/path/to/aclImdb \
python -m backend.ml.train
```

Or pass `--dataset-source acl-imdb --reviews-dir /path/to/aclImdb`. The directory must contain `train/pos`, `train/neg`, `test/pos`, and `test/neg`. Full training fits the vocabulary only on training reviews and shuffles the raw class-grouped files before validation splitting.

The checked-in model artifacts were trained with `tf.keras.datasets.imdb.load_data(num_words=10000)` on the full 25,000-review training split and evaluated against Keras' separate 25,000-review test split (5 epochs, seed 42). Their recorded values are in `backend/artifacts/model_metrics.json`; retraining overwrites these artifacts with the newly measured values.

### Model comparison

- **Accuracy** is measured on the held-out test split.
- **Validation accuracy** is measured on a validation portion of training data and is used to identify the selected/best model.
- **Training time** is the elapsed wall time for `model.fit` on that run; it varies by hardware and run settings.

All three values are computed during training and written to `model_metrics.json`. The UI reads the file through `/models`; if no evaluation values exist, it shows an empty state instead of inventing metrics.

## API documentation

### `POST /predict`

Request:

```json
{
  "review": "The movie was absolutely fantastic",
  "model": "lstm"
}
```

`model` is optional; when omitted, the model with the highest recorded validation accuracy is used. Valid model keys are `simple_rnn`, `lstm`, and `gru`.

Response:

```json
{
  "sentiment": "Positive",
  "confidence": 96.4,
  "positive_probability": 0.964,
  "negative_probability": 0.036,
  "model": "lstm",
  "model_name": "LSTM"
}
```

The numeric example above illustrates the response shape; live values always come from the loaded model. Inputs must contain non-whitespace text and be no longer than 20,000 characters. Empty/invalid requests return HTTP 422; unavailable model artifacts return HTTP 503.

### Supporting endpoints

- `GET /health` — API and model readiness, loaded-model count, selected model, and preprocessing dimensions.
- `GET /models` — model availability, measured accuracy/validation accuracy/training time, and best-model selection.
- `GET /docs` — interactive OpenAPI documentation.

## Frontend behavior

- Analysis history and the theme preference stay in browser local storage; review text is sent to the API only when Analyze is pressed.
- Network errors, invalid API payloads, empty reviews, and missing models are surfaced in the UI.
- Analysis requests are asynchronous and show a loading state.
- The API status refreshes periodically and can be checked manually.
- The theme preference and recent results are persisted locally.

## Future improvements

- Aspect-based sentiment and explainable token-level signals.
- Product-domain fine-tuning, multilingual datasets, and calibration.
- Transformer/BERT comparison and reproducible experiment tracking.
- Optional database-backed history and user authentication.
- Batch prediction, model versioning, and production observability.

## Limitations

- This is an English, binary classifier trained on movie reviews; product or other-domain reviews may not match its training distribution.
- The required 50-token window discards earlier tokens in long reviews and short reviews are heavily padded.
- A two-dimensional embedding is intentionally small for the learning exercise and limits model capacity.
- Confidence is derived directly from an uncalibrated sigmoid probability; it should not be interpreted as a calibrated probability of correctness.
- Results can vary after changing sample size, seed, epochs, TensorFlow version, or hardware. Full training takes longer than the fast development preset.
- There is no authentication or rate limiting; production deployment should add both and configure restrictive CORS origins.
