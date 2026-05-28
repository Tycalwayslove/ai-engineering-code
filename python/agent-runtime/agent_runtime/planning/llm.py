import hashlib
import json
import logging
from importlib import import_module
from os import environ
from time import perf_counter
from typing import Any, Protocol

from agent_runtime.context.types import ContextPack
from agent_runtime.parsers.rule_parser import RuleParser
from agent_runtime.planning.engine import PlanningEngine
from agent_runtime.planning.prompts import (
    LLM_PLANNER_SYSTEM_PROMPT,
    render_planning_prompt,
)
from agent_runtime.planning.rule_based import RuleBasedPlanningEngine
from agent_runtime.planning.types import (
    ClarificationRequest,
    PlanCandidate,
    PlanningInput,
    PlanningResult,
    ProposedAction,
)

LOGGER = logging.getLogger("uvicorn.error")

MANAGEMENT_ACTION_TYPES = {
    "calendar.cancel_event",
    "calendar.update_event",
    "expense.submit_reimbursement",
    "expense.cancel_reimbursement",
    "expense.update_reimbursement",
    "reminder.complete_reminder",
    "reminder.cancel_reminder",
    "reminder.update_reminder",
}
DETERMINISTIC_CREATE_ACTION_TYPES = {
    "calendar.create_event",
    "expense.create_reimbursement_draft",
    "reminder.create_reminder",
}


class LlmProvider(Protocol):
    def complete(self, prompt: str) -> str: ...


class LlmProviderCallError(RuntimeError):
    def __init__(
        self,
        *,
        error_type: str,
        llm_call: dict[str, object],
    ) -> None:
        super().__init__(error_type)
        self.error_type = error_type
        self.llm_call = llm_call


class MockLlmProvider:
    def __init__(self, parser: RuleParser | None = None) -> None:
        self._parser = parser or RuleParser()

    def complete(self, prompt: str) -> str:
        user_input = self._extract_prompt_value(prompt, "user_input")
        now = self._extract_prompt_value(prompt, "now")
        timezone = self._extract_prompt_value(prompt, "timezone")
        parsed = self._parser.parse(text=user_input, now=now, timezone=timezone)
        return json.dumps(
            {
                "goal": "确认后执行计划"
                if len(parsed.actions) > 1
                else (parsed.actions[0]["summary"] if parsed.actions else ""),
                "actions": [
                    {
                        "domain": action["domain"],
                        "action_type": action["action_type"],
                        "summary": action["summary"],
                        "payload": action["payload"],
                        "risk_level": action["risk_level"],
                        "missing_fields": action["missing_fields"],
                    }
                    for action in parsed.actions
                ],
                "missing_information": sorted(
                    {
                        field
                        for action in parsed.actions
                        for field in action["missing_fields"]
                    }
                ),
                "assumptions": [],
                "risk_notes": [],
            },
            ensure_ascii=False,
        )

    def _extract_prompt_value(self, prompt: str, key: str) -> str:
        prefix = f"{key}: "
        for line in prompt.splitlines():
            if line.startswith(prefix):
                return line.removeprefix(prefix)
        return ""


class OpenAILlmProvider:
    def __init__(self, model: str = "gpt-4.1-mini") -> None:
        self._model = model
        self._system_prompt = LLM_PLANNER_SYSTEM_PROMPT

    @property
    def model(self) -> str:
        return self._model

    @property
    def system_prompt(self) -> str:
        return self._system_prompt

    def complete(self, prompt: str) -> str:
        if not environ.get("OPENAI_API_KEY"):
            raise RuntimeError("OPENAI_API_KEY is required for OpenAI LLM planning")

        try:
            openai_module = import_module("openai")
        except ImportError as exc:
            raise RuntimeError("openai package is required for AI_PLANNER_MODE=llm") from exc

        openai_client = openai_module.OpenAI
        client = openai_client(timeout=_request_timeout_seconds())
        response = client.responses.create(
            model=self._model,
            instructions=self._system_prompt,
            input=prompt,
        )
        output_text = getattr(response, "output_text", None)
        if not isinstance(output_text, str) or output_text.strip() == "":
            raise RuntimeError("OpenAI response did not include output_text")
        return output_text


class OpenAICompatibleChatLlmProvider:
    def __init__(
        self,
        *,
        provider_name: str,
        api_key_env: str,
        base_url: str,
        model: str,
        system_prompt: str = LLM_PLANNER_SYSTEM_PROMPT,
    ) -> None:
        self._provider_name = provider_name
        self._api_key_env = api_key_env
        self._base_url = base_url
        self._model = model
        self._system_prompt = system_prompt

    @property
    def model(self) -> str:
        return self._model

    @property
    def system_prompt(self) -> str:
        return self._system_prompt

    def complete(self, prompt: str) -> str:
        api_key = environ.get(self._api_key_env)
        if not api_key:
            raise RuntimeError(
                f"{self._api_key_env} is required for {self._provider_name} LLM planning",
            )

        try:
            openai_module = import_module("openai")
        except ImportError as exc:
            raise RuntimeError(
                f"openai package is required for {self._provider_name} LLM planning",
            ) from exc

        openai_client = openai_module.OpenAI
        client = openai_client(
            api_key=api_key,
            base_url=self._base_url,
            timeout=_request_timeout_seconds(),
        )
        response = client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": self._system_prompt},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )
        content = self._extract_content(response)
        if content.strip() == "":
            raise RuntimeError(f"{self._provider_name} response did not include content")
        return content

    def _extract_content(self, response: object) -> str:
        choices = getattr(response, "choices", None)
        if not isinstance(choices, list) or not choices:
            raise RuntimeError(f"{self._provider_name} response did not include choices")
        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", None)
        if not isinstance(content, str):
            raise RuntimeError(f"{self._provider_name} response did not include message content")
        return content


class DeepSeekLlmProvider(OpenAICompatibleChatLlmProvider):
    def __init__(
        self,
        model: str = "deepseek-v4-flash",
        base_url: str = "https://api.deepseek.com",
    ) -> None:
        super().__init__(
            provider_name="DeepSeek",
            api_key_env="DEEPSEEK_API_KEY",
            base_url=base_url,
            model=model,
        )


def _request_timeout_seconds() -> float:
    raw_timeout = environ.get("AI_PLANNER_REQUEST_TIMEOUT_SECONDS", "20")
    try:
        timeout = float(raw_timeout)
    except ValueError:
        return 20.0
    if timeout <= 0:
        return 20.0
    return timeout


class LlmPlanningEngine(PlanningEngine):
    def __init__(
        self,
        provider: LlmProvider | None = None,
        mode: str = "llm_mock",
    ) -> None:
        self._provider = provider or MockLlmProvider()
        self._mode = mode

    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        prompt = render_planning_prompt(planning_input, context_pack)
        started_at = perf_counter()
        try:
            provider_output = self._provider.complete(prompt)
        except Exception as exc:
            llm_call = self._provider_call_observation(
                prompt=prompt,
                response_text=None,
                duration_ms=self._elapsed_ms(started_at),
                status="failed",
                error_type=type(exc).__name__,
            )
            raise LlmProviderCallError(
                error_type=type(exc).__name__,
                llm_call=llm_call,
            ) from exc

        llm_call = self._provider_call_observation(
            prompt=prompt,
            response_text=provider_output,
            duration_ms=self._elapsed_ms(started_at),
            status="completed",
            error_type=None,
        )

        try:
            payload = self._loads_provider_json(provider_output)
            result = self._result_from_payload(payload)
        except (TypeError, ValueError, KeyError) as exc:
            return PlanningResult(
                kind="assistant_message",
                trace_id=f"{self._mode}-invalid-response",
                message=f"规划器返回格式无效：{exc}",
                planner_mode=self._mode,
                llm_call=llm_call,
            )

        if result.kind != "plan_candidate":
            return self._with_llm_call(result, llm_call)

        candidate = result.candidate
        if candidate is None or not candidate.proposed_actions:
            return PlanningResult(
                kind="assistant_message",
                trace_id=f"{self._mode}-no-action",
                message="我还没有识别到可执行的日程、费用或提醒动作。",
                planner_mode=self._mode,
                llm_call=llm_call,
            )

        return self._with_llm_call(result, llm_call)

    def _loads_provider_json(self, provider_output: str) -> object:
        return json.loads(self._strip_markdown_json_fence(provider_output))

    def _strip_markdown_json_fence(self, provider_output: str) -> str:
        text = provider_output.strip()
        if not text.startswith("```"):
            return provider_output

        lines = text.splitlines()
        if len(lines) < 3 or lines[-1].strip() != "```":
            return provider_output

        fence_language = lines[0].strip().removeprefix("```").strip().lower()
        if fence_language not in ("", "json"):
            return provider_output

        return "\n".join(lines[1:-1]).strip()

    def _result_from_payload(self, payload: Any) -> PlanningResult:
        if not isinstance(payload, dict):
            raise ValueError("top-level payload must be an object")

        response_type = str(payload.get("response_type", "plan_candidate"))
        if response_type == "chat":
            return PlanningResult(
                kind="assistant_message",
                trace_id=f"{self._mode}-chat",
                message=self._required_str(payload, "assistant_message"),
                structured_elements=self._structured_elements_from_payload(
                    payload.get("structured_elements", []),
                ),
                planner_mode=self._mode,
            )
        if response_type == "clarification":
            return PlanningResult(
                kind="clarification",
                trace_id=f"{self._mode}-clarification",
                clarification=self._clarification_from_payload(payload.get("clarification")),
                message=self._optional_str(payload.get("assistant_message")),
                planner_mode=self._mode,
            )
        if response_type not in ("plan_candidate", "mixed"):
            raise ValueError(f"unsupported response_type: {response_type}")

        return PlanningResult(
            kind="plan_candidate",
            trace_id=f"{self._mode}-planner-v1",
            candidate=self._candidate_from_payload(payload),
            message=self._optional_str(payload.get("assistant_message")),
            planner_mode=self._mode,
        )

    def _candidate_from_payload(self, payload: Any) -> PlanCandidate:
        if not isinstance(payload, dict):
            raise ValueError("top-level payload must be an object")

        actions = payload.get("actions")
        if not isinstance(actions, list):
            raise ValueError("actions must be a list")

        proposed_actions = [
            self._action_from_payload(action_payload) for action_payload in actions
        ]
        return PlanCandidate(
            goal=self._required_str(payload, "goal"),
            proposed_actions=proposed_actions,
            missing_information=self._string_list(payload.get("missing_information", [])),
            assumptions=self._string_list(payload.get("assumptions", [])),
            risk_notes=self._string_list(payload.get("risk_notes", [])),
        )

    def _action_from_payload(self, payload: object) -> ProposedAction:
        if not isinstance(payload, dict):
            raise ValueError("action must be an object")
        action_payload = payload.get("payload")
        if not isinstance(action_payload, dict):
            raise ValueError("action.payload must be an object")

        return ProposedAction(
            domain=self._required_str(payload, "domain"),
            action_type=self._required_str(payload, "action_type"),
            summary=self._required_str(payload, "summary"),
            payload=action_payload,
            risk_level=str(payload.get("risk_level", "medium")),
            missing_fields=self._string_list(payload.get("missing_fields", [])),
        )

    def _clarification_from_payload(self, payload: object) -> ClarificationRequest:
        if not isinstance(payload, dict):
            raise ValueError("clarification must be an object")
        partial_payload = payload.get("partial_payload", {})
        if not isinstance(partial_payload, dict):
            raise ValueError("clarification.partial_payload must be an object")

        return ClarificationRequest(
            intent_id=self._optional_str(payload.get("intent_id")),
            domain=self._optional_str(payload.get("domain")),
            action_type=self._optional_str(payload.get("action_type")),
            question=self._required_str(payload, "question"),
            missing_fields=self._string_list(payload.get("missing_fields", [])),
            quick_replies=self._string_list(payload.get("quick_replies", [])),
            partial_payload=partial_payload,
        )

    def _required_str(self, payload: dict[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError(f"{key} must be a non-empty string")
        return value

    def _optional_str(self, value: object) -> str | None:
        if not isinstance(value, str) or value.strip() == "":
            return None
        return value

    def _string_list(self, value: object) -> list[str]:
        if not isinstance(value, list):
            raise ValueError("expected list")
        return [str(item) for item in value]

    def _structured_elements_from_payload(self, value: object) -> list[dict[str, object]]:
        if not isinstance(value, list):
            raise ValueError("structured_elements must be a list")
        structured_elements: list[dict[str, object]] = []
        for item in value:
            if not isinstance(item, dict):
                raise ValueError("structured_elements items must be objects")
            structured_elements.append(dict(item))
        return structured_elements

    def _elapsed_ms(self, started_at: float) -> int:
        return round((perf_counter() - started_at) * 1000)

    def _provider_call_observation(
        self,
        *,
        prompt: str,
        response_text: str | None,
        duration_ms: int,
        status: str,
        error_type: str | None,
    ) -> dict[str, object]:
        provider_name = type(self._provider).__name__
        model = getattr(self._provider, "model", "unknown")
        prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
        response_chars = len(response_text) if response_text is not None else 0
        error_suffix = f" error_type={error_type}" if error_type is not None else ""

        LOGGER.info(
            "LLM planner provider call %s provider=%s model=%s mode=%s "
            "duration_ms=%s prompt_chars=%s response_chars=%s prompt_sha256=%s%s",
            status,
            provider_name,
            model,
            self._mode,
            duration_ms,
            len(prompt),
            response_chars,
            prompt_hash,
            error_suffix,
        )
        if environ.get("AI_PLANNER_LOG_PROMPT") == "1":
            LOGGER.info(
                "LLM planner prompt provider=%s model=%s mode=%s\n%s",
                provider_name,
                model,
                self._mode,
                prompt,
            )
        if response_text is not None and environ.get("AI_PLANNER_LOG_RESPONSE") == "1":
            LOGGER.info(
                "LLM planner response provider=%s model=%s mode=%s\n%s",
                provider_name,
                model,
                self._mode,
                response_text,
            )
        observation: dict[str, object] = {
            "provider": provider_name,
            "model": str(model),
            "mode": self._mode,
            "status": status,
            "durationMs": duration_ms,
            "promptChars": len(prompt),
            "responseChars": response_chars,
            "promptSha256": prompt_hash,
        }
        if error_type is not None:
            observation["errorType"] = error_type
        if environ.get("AI_PLANNER_TRACE_PROMPT") == "1":
            observation["promptPreview"] = prompt
        if response_text is not None and environ.get("AI_PLANNER_TRACE_RESPONSE") == "1":
            observation["responsePreview"] = response_text
        return observation

    def _with_llm_call(
        self,
        result: PlanningResult,
        llm_call: dict[str, object],
    ) -> PlanningResult:
        return PlanningResult(
            kind=result.kind,
            trace_id=result.trace_id,
            candidate=result.candidate,
            clarification=result.clarification,
            message=result.message,
            structured_elements=result.structured_elements,
            planner_mode=result.planner_mode,
            fallback_reason=result.fallback_reason,
            reasoning_summary=result.reasoning_summary,
            llm_call=llm_call,
        )


class LlmFirstPlanningEngine(PlanningEngine):
    def __init__(
        self,
        llm_engine: PlanningEngine | None = None,
        fallback_engine: PlanningEngine | None = None,
    ) -> None:
        self._llm_engine = llm_engine or LlmPlanningEngine(
            provider=OpenAILlmProvider(),
            mode="llm",
        )
        self._fallback_engine = fallback_engine or RuleBasedPlanningEngine()

    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        safety_result = self._rule_safety_precheck(planning_input, context_pack)
        if safety_result is not None:
            return safety_result

        try:
            llm_result = self._llm_engine.plan(planning_input, context_pack)
        except Exception as exc:
            if isinstance(exc, LlmProviderCallError):
                return self._fallback(
                    planning_input,
                    context_pack,
                    fallback_reason=f"llm_error: {exc.error_type}",
                    llm_call=exc.llm_call,
                )
            return self._fallback(
                planning_input,
                context_pack,
                fallback_reason=f"llm_error: {type(exc).__name__}",
            )

        if (
            llm_result.kind in ("assistant_message", "clarification")
            or (llm_result.kind == "plan_candidate" and llm_result.candidate is not None)
        ):
            return PlanningResult(
                kind=llm_result.kind,
                trace_id=llm_result.trace_id,
                candidate=llm_result.candidate,
                clarification=llm_result.clarification,
                message=llm_result.message,
                structured_elements=llm_result.structured_elements,
                planner_mode="llm_first",
                fallback_reason=None,
                reasoning_summary=llm_result.reasoning_summary,
                llm_call=llm_result.llm_call,
            )

        return self._fallback(
            planning_input,
            context_pack,
            fallback_reason=f"llm_no_candidate: {llm_result.trace_id}",
        )

    def _rule_safety_precheck(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult | None:
        rule_result = self._fallback_engine.plan(planning_input, context_pack)
        deterministic_action = self._deterministic_rule_action(
            planning_input,
            rule_result,
        )
        if deterministic_action is not None:
            return PlanningResult(
                kind=rule_result.kind,
                trace_id=f"llm_first-safety-{rule_result.trace_id}",
                candidate=rule_result.candidate,
                clarification=rule_result.clarification,
                message=rule_result.message,
                structured_elements=rule_result.structured_elements,
                planner_mode="llm_first",
                fallback_reason=(
                    f"rule_safety_deterministic: {deterministic_action}"
                ),
                reasoning_summary=rule_result.reasoning_summary,
            )

        if (
            rule_result.kind != "clarification"
            or rule_result.clarification is None
            or "target_id" not in rule_result.clarification.missing_fields
        ):
            return None

        return PlanningResult(
            kind="clarification",
            trace_id=f"llm_first-safety-{rule_result.trace_id}",
            clarification=rule_result.clarification,
            message=rule_result.message,
            structured_elements=rule_result.structured_elements,
            planner_mode="llm_first",
            fallback_reason="rule_safety_clarification: target_id",
            reasoning_summary=rule_result.reasoning_summary,
        )

    def _deterministic_rule_action(
        self,
        planning_input: PlanningInput,
        rule_result: PlanningResult,
    ) -> str | None:
        if self._looks_like_mixed_conversation(planning_input.text):
            return None
        if rule_result.kind != "plan_candidate" or rule_result.candidate is None:
            return None
        if len(rule_result.candidate.proposed_actions) != 1:
            return None
        action_type = rule_result.candidate.proposed_actions[0].action_type
        if action_type in DETERMINISTIC_CREATE_ACTION_TYPES:
            return action_type
        if action_type in MANAGEMENT_ACTION_TYPES:
            return action_type
        return None

    def _looks_like_mixed_conversation(self, text: str) -> bool:
        mixed_markers = ("顺便", "有点", "紧张", "焦虑", "开心", "难受")
        return any(marker in text for marker in mixed_markers)

    def _fallback(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
        fallback_reason: str,
        llm_call: dict[str, object] | None = None,
    ) -> PlanningResult:
        fallback_result = self._fallback_engine.plan(planning_input, context_pack)
        return PlanningResult(
            kind=fallback_result.kind,
            trace_id=f"llm_first-fallback-{fallback_result.trace_id}",
            candidate=fallback_result.candidate,
            clarification=fallback_result.clarification,
            message=fallback_result.message,
            structured_elements=fallback_result.structured_elements,
            planner_mode="llm_first",
            fallback_reason=fallback_reason,
            reasoning_summary=fallback_result.reasoning_summary,
            llm_call=llm_call,
        )
