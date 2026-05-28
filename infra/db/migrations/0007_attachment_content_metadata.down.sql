begin;

alter table attachment_intakes
  drop constraint if exists attachment_intakes_content_status_check;

alter table attachment_intakes
  drop column if exists content_status,
  drop column if exists content_sha256;

commit;
