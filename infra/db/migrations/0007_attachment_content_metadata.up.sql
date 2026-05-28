begin;

alter table attachment_intakes
  add column content_sha256 text,
  add column content_status text;

alter table attachment_intakes
  add constraint attachment_intakes_content_status_check
  check (content_status is null or content_status in ('content_received'));

commit;
