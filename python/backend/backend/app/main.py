from fastapi import FastAPI

from backend.app.routes.agent import router as agent_router
from backend.app.routes.calendar import router as calendar_router
from backend.app.routes.execution import router as execution_router
from backend.app.routes.expense import router as expense_router
from backend.app.routes.factory import router as factory_router
from backend.app.routes.health import router as health_router
from backend.app.routes.reminder import router as reminder_router
from backend.app.routes.version import router as version_router

app = FastAPI(title="AI Code API Gateway", version="0.1.0")
app.include_router(agent_router)
app.include_router(calendar_router)
app.include_router(execution_router)
app.include_router(expense_router)
app.include_router(factory_router)
app.include_router(health_router)
app.include_router(reminder_router)
app.include_router(version_router)
