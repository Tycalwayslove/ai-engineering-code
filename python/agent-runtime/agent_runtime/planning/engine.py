from typing import Protocol

from agent_runtime.context.types import ContextPack
from agent_runtime.planning.types import PlanningInput, PlanningResult


class PlanningEngine(Protocol):
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult: ...
