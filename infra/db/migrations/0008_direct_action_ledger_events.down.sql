alter table execution_ledger
drop constraint execution_ledger_event_type_check;

alter table execution_ledger
add constraint execution_ledger_event_type_check check (
  event_type in (
    'plan_created',
    'confirmation_created',
    'action_executed',
    'action_failed',
    'plan_rejected'
  )
);
