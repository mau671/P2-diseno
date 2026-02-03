-- Add paid_at to payments to match existing trigger expectations
set search_path = public, extensions;

alter table public.payments
  add column if not exists paid_at timestamptz;

update public.payments
set paid_at = created_at
where paid_at is null
  and status = 'paid';

comment on column public.payments.paid_at is 'Timestamp when payment was marked as paid.';
