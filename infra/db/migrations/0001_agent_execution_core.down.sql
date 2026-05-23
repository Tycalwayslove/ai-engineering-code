begin;

drop trigger if exists reminders_set_updated_at on reminders;
drop trigger if exists expense_records_set_updated_at on expense_records;
drop trigger if exists calendar_events_set_updated_at on calendar_events;
drop trigger if exists confirmations_set_updated_at on confirmations;
drop trigger if exists domain_actions_set_updated_at on domain_actions;
drop trigger if exists execution_plans_set_updated_at on execution_plans;
drop trigger if exists conversations_set_updated_at on conversations;
drop trigger if exists users_set_updated_at on users;

drop function if exists set_updated_at();

drop table if exists reminders;
drop table if exists expense_records;
drop table if exists calendar_events;
drop table if exists execution_ledger;
drop table if exists confirmation_actions;
drop table if exists confirmations;
drop table if exists domain_actions;
drop table if exists execution_plans;
drop table if exists conversation_turns;
drop table if exists conversations;
drop table if exists users;

commit;

