-- Recurring order schedule upgrade
set search_path = public, extensions;

alter table public.recurring_orders
  drop constraint if exists recurring_orders_frequency_check;

alter table public.recurring_orders
  drop column if exists frequency;

alter table public.recurring_orders
  add column if not exists interval_unit text not null default 'week'
    check (interval_unit in ('week', 'month')),
  add column if not exists interval_value integer not null default 1
    check (interval_value >= 1),
  add column if not exists days_of_week integer[],
  add column if not exists days_of_month integer[],
  add column if not exists time_windows jsonb not null default '[]'::jsonb,
  add column if not exists time_zone text not null default 'America/Costa_Rica'
    check (time_zone = 'America/Costa_Rica'),
  add column if not exists start_date date not null default current_date,
  add column if not exists end_date date,
  add column if not exists last_run_at timestamptz;

comment on column public.recurring_orders.interval_unit is 'Scheduling unit: week or month.';
comment on column public.recurring_orders.interval_value is 'Interval multiplier for the unit.';
comment on column public.recurring_orders.days_of_week is 'Days of week 0-6 for weekly schedules.';
comment on column public.recurring_orders.days_of_month is 'Days of month 1-31 for monthly schedules.';
comment on column public.recurring_orders.time_windows is 'Preferred delivery time windows in HH:mm.';
comment on column public.recurring_orders.time_zone is 'Fixed time zone for schedule.';
comment on column public.recurring_orders.start_date is 'First eligible delivery date.';
comment on column public.recurring_orders.end_date is 'Optional end date for schedule.';
comment on column public.recurring_orders.last_run_at is 'Last executed delivery time.';
