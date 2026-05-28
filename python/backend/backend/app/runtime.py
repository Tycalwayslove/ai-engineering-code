from backend.app.bootstrap import create_runtime

runtime = create_runtime()

execution_store = runtime.execution_store
pending_clarification_store = runtime.pending_clarification_store
attachment_repository = runtime.attachment_repository
calendar_repository = runtime.calendar_repository
expense_repository = runtime.expense_repository
reminder_repository = runtime.reminder_repository
conversation_turn_store = runtime.conversation_turn_store
event_log_repository = runtime.event_log_repository
decision_trace_repository = runtime.decision_trace_repository
attachment_service = runtime.attachment_service
calendar_service = runtime.calendar_service
expense_service = runtime.expense_service
reminder_service = runtime.reminder_service
direct_action_auditor = runtime.direct_action_auditor
execution_planner = runtime.execution_planner
execution_coordinator = runtime.execution_coordinator
submit_turn_use_case = runtime.submit_turn_use_case
confirm_plan_use_case = runtime.confirm_plan_use_case
reject_plan_use_case = runtime.reject_plan_use_case
