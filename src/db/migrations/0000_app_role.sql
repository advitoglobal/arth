-- App role for hosted Postgres (Neon). Local already has arth_app.
-- The role has no BYPASSRLS. The Neon owner must not be the Vercel user.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'arth_app') THEN
    CREATE ROLE arth_app NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO arth_app;

DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO arth_app', current_database());
END
$$;
