from backend.app.main import app
from fastapi.testclient import TestClient


def test_factory_status_returns_capabilities_and_version() -> None:
    client = TestClient(app)
    response = client.get("/factory/status")

    assert response.status_code == 200
    assert response.json() == {
        "name": "AI Code Factory",
        "status": "ready",
        "version": "0.1.0",
        "capabilities": [
            {
                "id": "contracts",
                "label": "Contract-first API",
                "status": "ready",
            },
            {
                "id": "backend",
                "label": "FastAPI gateway",
                "status": "ready",
            },
            {
                "id": "sdk",
                "label": "TypeScript SDK",
                "status": "ready",
            },
            {
                "id": "web-surfaces",
                "label": "H5 and Admin surfaces",
                "status": "ready",
            },
        ],
    }
