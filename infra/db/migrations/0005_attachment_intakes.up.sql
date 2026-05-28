begin;

create table attachment_intakes (
  id text primary key,
  conversation_id text references conversations(id) on delete set null,
  native_attachment_id text not null,
  kind text not null,
  name text not null,
  type text,
  size_bytes integer,
  source text,
  text text,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  constraint attachment_intakes_status_check check (status in ('received')),
  constraint attachment_intakes_size_check check (size_bytes is null or size_bytes >= 0)
);

create index attachment_intakes_conversation_id_created_at_idx
  on attachment_intakes(conversation_id, created_at desc);

commit;
