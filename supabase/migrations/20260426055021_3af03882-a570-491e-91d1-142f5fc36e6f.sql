
create or replace function public.touch_user_credits()
returns trigger
language plpgsql
set search_path = public
as $$
begin NEW.updated_at = now(); return NEW; end;
$$;

-- Block all client access; service role bypasses RLS.
create policy "No client access to data_source_cache"
  on public.data_source_cache for select
  to authenticated
  using (false);
