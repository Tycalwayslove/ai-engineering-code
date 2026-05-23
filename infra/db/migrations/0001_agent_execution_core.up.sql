begin;

create table users (
  id text primary key,
  external_user_id text unique,
  display_name text,
  locale text not null default 'zh-CN',
  timezone text not null default 'Asia/Shanghai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversations (
  id text primary key,
  user_id text not null references users(id) on delete restrict,
  title text,
  status text not null default 'open',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_status_check check (status in ('open', 'archived'))
);

create table conversation_turns (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  role text not null,
  input_text text,
  response_summary text,
  raw_content jsonb,
  structured_response jsonb,
  created_at timestamptz not null default now(),
  constraint conversation_turns_role_check check (role in ('user', 'assistant', 'system'))
);

create table execution_plans (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  turn_id text references conversation_turns(id) on delete set null,
  status text not null,
  risk_level text not null,
  summary text not null,
  decision_trace_id text not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint execution_plans_status_check check (
    status in (
      'awaiting_confirmation',
      'executing',
      'succeeded',
      'failed',
      'rejected',
      'expired'
    )
  ),
  constraint execution_plans_risk_level_check check (risk_level in ('low', 'medium', 'high'))
);

create table domain_actions (
  id text primary key,
  plan_id text not null references execution_plans(id) on delete cascade,
  domain text not null,
  action_type text not null,
  status text not null,
  risk_level text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  idempotency_key text not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint domain_actions_domain_check check (domain in ('calendar', 'expense', 'reminder')),
  constraint domain_actions_status_check check (
    status in (
      'planned',
      'awaiting_confirmation',
      'executing',
      'succeeded',
      'failed',
      'rejected'
    )
  ),
  constraint domain_actions_risk_level_check check (risk_level in ('low', 'medium', 'high')),
  constraint domain_actions_plan_id_id_unique unique (plan_id, id),
  constraint domain_actions_idempotency_key_unique unique (idempotency_key)
);

create table confirmations (
  id text primary key,
  plan_id text not null references execution_plans(id) on delete cascade,
  status text not null default 'pending',
  title text not null,
  description text not null,
  confirm_token_hash text not null unique,
  expires_at timestamptz,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint confirmations_status_check check (
    status in ('pending', 'confirmed', 'rejected', 'expired')
  ),
  constraint confirmations_id_plan_id_unique unique (id, plan_id)
);

create table confirmation_actions (
  plan_id text not null,
  confirmation_id text not null references confirmations(id) on delete cascade,
  action_id text not null references domain_actions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (confirmation_id, action_id),
  constraint confirmation_actions_confirmation_plan_fk
    foreign key (confirmation_id, plan_id)
    references confirmations(id, plan_id)
    on delete cascade,
  constraint confirmation_actions_action_plan_fk
    foreign key (plan_id, action_id)
    references domain_actions(plan_id, id)
    on delete cascade
);

create table execution_ledger (
  id text primary key,
  plan_id text not null references execution_plans(id) on delete cascade,
  action_id text,
  event_type text not null,
  status text not null,
  message text not null,
  before_snapshot jsonb,
  after_snapshot jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  constraint execution_ledger_status_check check (status in ('info', 'succeeded', 'failed')),
  constraint execution_ledger_event_type_check check (
    event_type in (
      'plan_created',
      'confirmation_created',
      'action_executed',
      'action_failed',
      'plan_rejected'
    )
  ),
  constraint execution_ledger_action_plan_fk
    foreign key (plan_id, action_id)
    references domain_actions(plan_id, id)
    on delete cascade
);

create table calendar_events (
  id text primary key,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null,
  status text not null default 'scheduled',
  source_action_id text not null unique references domain_actions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_status_check check (status in ('scheduled', 'canceled')),
  constraint calendar_events_time_order_check check (end_at > start_at)
);

create table expense_records (
  id text primary key,
  title text not null,
  amount numeric(12, 2),
  currency char(3) not null default 'CNY',
  occurred_on date,
  status text not null default 'draft',
  source_action_id text not null unique references domain_actions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_records_status_check check (status in ('draft', 'submitted', 'canceled')),
  constraint expense_records_amount_check check (amount is null or amount >= 0)
);

create table reminders (
  id text primary key,
  title text not null,
  due_at timestamptz not null,
  timezone text not null,
  status text not null default 'scheduled',
  source_action_id text not null unique references domain_actions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_status_check check (status in ('scheduled', 'done', 'canceled'))
);

create index conversations_user_id_updated_at_idx on conversations(user_id, updated_at desc);
create index conversation_turns_conversation_id_created_at_idx
  on conversation_turns(conversation_id, created_at);
create index execution_plans_conversation_id_created_at_idx
  on execution_plans(conversation_id, created_at desc);
create index execution_plans_status_idx on execution_plans(status);
create index domain_actions_plan_id_status_idx on domain_actions(plan_id, status);
create index execution_ledger_plan_id_created_at_idx on execution_ledger(plan_id, created_at);
create index calendar_events_start_at_idx on calendar_events(start_at);
create index expense_records_status_idx on expense_records(status);
create index reminders_status_due_at_idx on reminders(status, due_at);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

create trigger conversations_set_updated_at
before update on conversations
for each row execute function set_updated_at();

create trigger execution_plans_set_updated_at
before update on execution_plans
for each row execute function set_updated_at();

create trigger domain_actions_set_updated_at
before update on domain_actions
for each row execute function set_updated_at();

create trigger confirmations_set_updated_at
before update on confirmations
for each row execute function set_updated_at();

create trigger calendar_events_set_updated_at
before update on calendar_events
for each row execute function set_updated_at();

create trigger expense_records_set_updated_at
before update on expense_records
for each row execute function set_updated_at();

create trigger reminders_set_updated_at
before update on reminders
for each row execute function set_updated_at();

commit;
