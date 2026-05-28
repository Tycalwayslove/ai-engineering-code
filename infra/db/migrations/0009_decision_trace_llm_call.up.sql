begin;

alter table decision_traces
  add column if not exists llm_call jsonb;

commit;
