from fastapi import APIRouter

router = APIRouter()


@router.get("/version")
def get_version() -> dict[str, str]:
    return {"name": "ai-code-api", "version": "0.1.0"}
