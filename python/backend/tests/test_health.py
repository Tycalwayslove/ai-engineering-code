from backend.app.main import app
from fastapi.testclient import TestClient


def test_health_returns_ok() -> None:
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_local_h5_origin_can_call_api() -> None:
    client = TestClient(app)
    response = client.options(
        "/agent/turns",
        headers={
            "Access-Control-Request-Method": "POST",
            "Origin": "http://192.168.1.238:3000",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://192.168.1.238:3000"
