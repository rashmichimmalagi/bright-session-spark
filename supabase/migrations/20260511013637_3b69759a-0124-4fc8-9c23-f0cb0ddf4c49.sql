DROP POLICY IF EXISTS sessions_select_all ON public.sessions;
CREATE POLICY sessions_public_select ON public.sessions FOR SELECT TO anon, authenticated USING (true);