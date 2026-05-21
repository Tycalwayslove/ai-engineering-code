from fastapi import APIRouter

router = APIRouter(prefix="/reminders")


@router.get("")
def get_reminders() -> list[dict[str, object]]:
    return []
