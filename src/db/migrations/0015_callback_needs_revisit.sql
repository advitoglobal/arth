-- Connected, callback always needs a revisit day. A fabricated hour is not stored.

UPDATE config_dispositions
SET requires_revisit = true
WHERE key = 'connected_callback';
