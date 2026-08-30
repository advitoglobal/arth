-- Isolation proofs and floor scripts set tenant_id and user_id, not always role_key.
-- Fall back to arth_lead_row_visible, which reads the seat from users.

DROP POLICY IF EXISTS tenant_isolation ON leads;
CREATE POLICY tenant_isolation ON leads
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      CASE NULLIF(current_setting('app.role_key', true), '')
        WHEN 'owner' THEN true
        WHEN 'adv' THEN true
        WHEN 'admin' THEN true
        WHEN 'ops' THEN true
        WHEN 'gm' THEN true
        WHEN 'acct' THEN false
        WHEN 'mgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        WHEN 'salesmgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          AND department_key = 'sales'
        WHEN 'svcmgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          AND department_key = 'service'
        WHEN 'lead' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
          OR EXISTS (
            SELECT 1 FROM users ru JOIN positions rp ON rp.id = ru.position_id
            WHERE ru.id = leads.owner_user_id
              AND rp.reports_to = NULLIF(current_setting('app.position_id', true), '')::uuid
          )
        WHEN 'tele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'sales'
          )
        WHEN 'svctele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'service'
          )
        WHEN 'instele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'insurance'
          )
        WHEN 'sales' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NOT NULL AND pool_open
            AND department_key = 'sales'
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'svc' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NOT NULL AND pool_open
            AND department_key = 'service'
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'ins' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NOT NULL AND pool_open
            AND department_key = 'insurance'
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'tdcoord' THEN
          testdrive_at IS NOT NULL
          AND department_key = 'sales'
          AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ELSE arth_lead_row_visible(tenant_id, branch_id, owner_user_id, first_responded_at)
          AND arth_dept_ok(department_key)
      END
    )
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
