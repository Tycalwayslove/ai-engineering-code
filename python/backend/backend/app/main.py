from fastapi import FastAPI

from backend.app.routes.factory import router as factory_router
from backend.app.routes.health import router as health_router
from backend.app.routes.version import router as version_router

app = FastAPI(title="AI Code API Gateway", version="0.1.0")
app.include_router(factory_router)
app.include_router(health_router)
app.include_router(version_router)
