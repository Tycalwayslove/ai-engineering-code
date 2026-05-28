create table if not exists pending_clarifications (
  id text primary key,
  conversation_id text not null references conversations(id),
  domain text not null,
  action_type text not null,
  question text not null,
  missing_fields jsonb not null default '[]'::jsonb,
  partial_payload jsonb not null default '{}'::jsonb,
  quick_replies jsonb not null default '[]'::jsonb,
  status text not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  resolved_at timestamptz
);

create index if not exists idx_pending_clarifications_open
  on pending_clarifications (conversation_id, status, expires_at, created_at desc);
