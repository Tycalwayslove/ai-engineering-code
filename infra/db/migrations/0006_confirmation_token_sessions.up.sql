begin;

create table confirmation_token_sessions (
  id text primary key,
  confirmation_id text not null,
  plan_id text not null,
  confirm_token_hash text not null unique,
  status text not null default 'active',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint confirmation_token_sessions_status_check check (
    status in ('active', 'used', 'revoked', 'expired')
  ),
  constraint confirmation_token_sessions_confirmation_plan_fk
    foreign key (confirmation_id, plan_id)
    references confirmations(id, plan_id)
    on delete cascade
);

create index confirmation_token_sessions_plan_status_idx
  on confirmation_token_sessions(plan_id, status, expires_at);

commit;
