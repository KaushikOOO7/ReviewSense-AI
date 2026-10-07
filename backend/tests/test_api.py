from fastapi.testclient import TestClient

from backend.main import app


def test_health_and_model_metadata_are_explicit():
    with TestClient(app) as client:
        health = client.get("/health")
        model_list = client.get("/models")

        assert health.status_code == 200
        assert model_list.status_code == 200
        assert set(model["key"] for model in model_list.json()["models"]) == {
            "simple_rnn",
            "lstm",
            "gru",
        }
        assert health.json()["ml_ready"] == model_list.json()["ready"]


def test_empty_reviews_are_rejected_before_prediction():
    with TestClient(app) as client:
        response = client.post("/predict", json={"review": "   "})
        assert response.status_code == 422


def test_prediction_contract_uses_loaded_model_or_reports_unavailable():
    with TestClient(app) as client:
        health = client.get("/health").json()
        response = client.post(
            "/predict",
            json={"review": "The acting was warm and the story was wonderful."},
        )

        if not health["ml_ready"]:
            assert response.status_code == 503
            return

        assert response.status_code == 200
        payload = response.json()
        assert payload["sentiment"] in {"Positive", "Negative"}
        assert 50 <= payload["confidence"] <= 100
        assert 0 <= payload["positive_probability"] <= 1
        assert 0 <= payload["negative_probability"] <= 1
        assert abs(payload["positive_probability"] + payload["negative_probability"] - 1) < 0.001
        assert payload["model"] in {"simple_rnn", "lstm", "gru"}
