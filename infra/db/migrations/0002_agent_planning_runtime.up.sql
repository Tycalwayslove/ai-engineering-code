begin;

create table agent_events (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  turn_id text references conversation_turns(id) on delete set null,
  plan_id text references execution_plans(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table decision_traces (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  planner_mode text not null,
  context_sections_used jsonb not null default '[]'::jsonb,
  tools_considered jsonb not null default '[]'::jsonb,
  tools_selected jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  policy_decisions jsonb not null default '[]'::jsonb,
  confirmation_reason text,
  fallback_reason text,
  reasoning_summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint decision_traces_planner_mode_check check (
    planner_mode in ('rule', 'llm_mock', 'llm', 'llm_first', 'pending_clarification')
  )
);

create table summary_memories (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  memory_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  source_event_ids text[] not null default array[]::text[],
  created_at timestamptz not null default now()
);

create index agent_events_conversation_id_created_at_idx
  on agent_events(conversation_id, created_at);
create index decision_traces_conversation_id_created_at_idx
  on decision_traces(conversation_id, created_at);
create index summary_memories_conversation_id_created_at_idx
  on summary_memories(conversation_id, created_at desc);

commit;
