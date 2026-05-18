from fastapi import APIRouter

from backend.app.services.factory_status import FactoryStatus, get_factory_status

router = APIRouter(prefix="/factory")


@router.get("/status")
def get_status() -> FactoryStatus:
    return get_factory_status()
