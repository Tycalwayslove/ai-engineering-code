from agent_runtime.planning.types import PlanCandidate
from agent_runtime.policy.types import PolicyDecision
from agent_runtime.tools.catalog import BuiltInToolCatalog


class PolicyEngine:
    def __init__(self, tool_catalog: BuiltInToolCatalog | None = None) -> None:
        self._tool_catalog = tool_catalog or BuiltInToolCatalog()

    def evaluate(self, candidate: PlanCandidate) -> PolicyDecision:
        unknown_actions = []
        tools_by_action_type = {}
        for action in candidate.proposed_actions:
            try:
                tools_by_action_type[action.action_type] = self._tool_catalog.get_tool(
                    action.action_type,
                )
            except KeyError:
                unknown_actions.append(action.action_type)

        if unknown_actions:
            return PolicyDecision(
                requires_confirmation=False,
                required_action_indexes=[],
                risk_level="medium",
                clarification_question="我还不能安全执行这个动作。",
                missing_fields=["supported_action_type"],
                policy_notes=[
                    f"未知工具动作：{', '.join(sorted(set(unknown_actions)))}。",
                ],
            )

        missing_fields = sorted(
            {
                field
                for action in candidate.proposed_actions
                for field in [
                    *action.missing_fields,
                    *self._missing_required_payload_fields(
                        payload=action.payload,
                        input_schema=tools_by_action_type[action.action_type].input_schema,
                    ),
                ]
            }
        )
        if missing_fields:
            return PolicyDecision(
                requires_confirmation=False,
                required_action_indexes=[],
                risk_level="medium",
                clarification_question=self._clarification_question(missing_fields),
                missing_fields=missing_fields,
                policy_notes=["缺少必要字段，不能生成待确认写入计划。"],
            )

        invalid_type_fields = sorted(
            {
                field
                for action in candidate.proposed_actions
                for field in self._invalid_payload_type_fields(
                    payload=action.payload,
                    input_schema=tools_by_action_type[action.action_type].input_schema,
                )
            }
        )
        if invalid_type_fields:
            return PolicyDecision(
                requires_confirmation=False,
                required_action_indexes=[],
                risk_level="medium",
                clarification_question=(
                    f"需要修正字段类型：{', '.join(invalid_type_fields)}。"
                ),
                missing_fields=invalid_type_fields,
                policy_notes=["字段类型不符合工具目录，不能生成待确认写入计划。"],
            )

        required_action_indexes = list(range(len(candidate.proposed_actions)))
        return PolicyDecision(
            requires_confirmation=bool(required_action_indexes),
            required_action_indexes=required_action_indexes,
            risk_level="medium" if required_action_indexes else "low",
            policy_notes=["写入动作需要用户确认。"] if required_action_indexes else [],
        )

    def _clarification_question(self, missing_fields: list[str]) -> str:
        if missing_fields == ["amount"]:
            return "打车票报销需要补充金额。"
        return f"需要补充：{', '.join(missing_fields)}。"

    def _missing_required_payload_fields(
        self,
        *,
        payload: dict[str, object],
        input_schema: dict[str, object],
    ) -> list[str]:
        required = input_schema.get("required", [])
        if not isinstance(required, list):
            return []
        missing = []
        for field in required:
            if not isinstance(field, str):
                continue
            value = payload.get(field)
            if value is None or value == "":
                missing.append(field)
        return missing

    def _invalid_payload_type_fields(
        self,
        *,
        payload: dict[str, object],
        input_schema: dict[str, object],
    ) -> list[str]:
        properties = input_schema.get("properties", {})
        if not isinstance(properties, dict):
            return []
        invalid_fields = []
        for field, schema in properties.items():
            if not isinstance(field, str) or field not in payload:
                continue
            if not isinstance(schema, dict):
                continue
            expected_type = schema.get("type")
            if not isinstance(expected_type, str):
                continue
            value = payload[field]
            if not self._matches_json_type(value, expected_type):
                invalid_fields.append(field)
                continue
            if expected_type == "object" and isinstance(value, dict):
                for nested_field in self._invalid_payload_type_fields(
                    payload=value,
                    input_schema=schema,
                ):
                    invalid_fields.append(f"{field}.{nested_field}")
        return invalid_fields

    def _matches_json_type(self, value: object, expected_type: str) -> bool:
        match expected_type:
            case "string":
                return isinstance(value, str)
            case "number":
                return isinstance(value, int | float) and not isinstance(value, bool)
            case "object":
                return isinstance(value, dict)
            case "array":
                return isinstance(value, list)
            case "boolean":
                return isinstance(value, bool)
            case _:
                return True
