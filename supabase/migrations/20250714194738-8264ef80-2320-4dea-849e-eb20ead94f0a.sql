-- Create a default active voting period for current month
INSERT INTO public.voting_periods (month, start_date, end_date, is_active, is_finalized)
VALUES (
  to_char(CURRENT_DATE, 'YYYY-MM'),
  date_trunc('month', CURRENT_DATE),
  date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day',
  true,
  false
) ON CONFLICT DO NOTHING;