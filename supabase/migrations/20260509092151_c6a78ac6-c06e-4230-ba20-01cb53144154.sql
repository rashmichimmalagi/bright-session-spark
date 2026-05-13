
CREATE OR REPLACE FUNCTION public.lookup_email_by_identifier(_identifier text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email FROM public.profiles
  WHERE LOWER(usn) = LOWER(_identifier)
     OR LOWER(admin_id) = LOWER(_identifier)
     OR LOWER(email) = LOWER(_identifier)
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.lookup_email_by_identifier(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_identifier(text) TO anon, authenticated;
