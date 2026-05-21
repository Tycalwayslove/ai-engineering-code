from fastapi import APIRouter

router = APIRouter(prefix="/expenses")


@router.get("")
def get_expenses() -> list[dict[str, object]]:
    return []
