from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from backend.app.routes.agent import router as agent_router
from backend.app.routes.attachment import router as attachment_router
from backend.app.routes.calendar import router as calendar_router
from backend.app.routes.execution import router as execution_router
from backend.app.routes.expense import router as expense_router
from backend.app.routes.factory import router as factory_router
from backend.app.routes.health import router as health_router
from backend.app.routes.reminder import router as reminder_router
from backend.app.routes.version import router as version_router

app = FastAPI(title="AI Code API Gateway", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$",
)
app.include_router(agent_router)
app.include_router(attachment_router)
app.include_router(calendar_router)
app.include_router(execution_router)
app.include_router(expense_router)
app.include_router(factory_router)
app.include_router(health_router)
app.include_router(reminder_router)
app.include_router(version_router)
