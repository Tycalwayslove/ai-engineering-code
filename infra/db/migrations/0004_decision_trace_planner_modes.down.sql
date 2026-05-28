begin;

alter table decision_traces
  drop constraint if exists decision_traces_planner_mode_check;

alter table decision_traces
  add constraint decision_traces_planner_mode_check check (
    planner_mode in ('rule', 'llm_mock', 'llm')
  );

commit;
