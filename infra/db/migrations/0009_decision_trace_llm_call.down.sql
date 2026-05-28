begin;

alter table decision_traces
  drop column if exists llm_call;

commit;
