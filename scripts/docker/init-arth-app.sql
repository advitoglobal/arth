-- Local app role. Matches .env.example. Demo password only.
CREATE USER arth_app WITH PASSWORD 'arth_local_dev_only';
GRANT ALL ON SCHEMA public TO arth_app;
GRANT ALL ON DATABASE arth TO arth_app;
