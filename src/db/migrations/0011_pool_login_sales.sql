-- Passwords, coastal sales, shared pool until a telecaller reaches the customer.
-- Demo password hash is scrypt of the local demonstration password. Production uses SSO.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

UPDATE users SET
  username = 'iyer',
  password_hash = 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'
WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1';

UPDATE users SET
  username = 'nair',
  password_hash = 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'
WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddd3';

UPDATE users SET
  username = 'pinto',
  password_hash = 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'
WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddd2';

UPDATE users SET
  username = 'rao',
  password_hash = 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'
WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddd4';

INSERT INTO positions (id, tenant_id, branch_id, title)
VALUES (
  'cccccccc-cccc-cccc-cccc-ccccccccccc5',
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'Sales consultant'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, position_id, full_name, phone, role_key, workspace_key, username, password_hash)
VALUES (
  'dddddddd-dddd-dddd-dddd-ddddddddddd5',
  '22222222-2222-2222-2222-222222222222',
  'cccccccc-cccc-cccc-cccc-ccccccccccc5',
  'M. Dsouza',
  '9845022223',
  'sales',
  'pipe',
  'dsouza',
  'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (lower(username));

-- New names stay unowned until a connected call that actually reaches the customer.
UPDATE leads
SET owner_user_id = NULL,
    assigned_at = NULL,
    stage_key = 'new'
WHERE first_responded_at IS NULL
  AND lost_reason_key IS NULL
  AND stage_key IN ('new', 'assigned');

CREATE OR REPLACE FUNCTION arth_authenticate(p_username text)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  password_hash text,
  role_key text,
  workspace_key text,
  full_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.tenant_id, u.password_hash, u.role_key, u.workspace_key, u.full_name
  FROM users u
  WHERE u.username IS NOT NULL
    AND lower(u.username) = lower(trim(p_username))
    AND u.is_active
  LIMIT 1;
$$;

ALTER FUNCTION arth_authenticate(text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_authenticate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_authenticate(text) TO arth_app;
