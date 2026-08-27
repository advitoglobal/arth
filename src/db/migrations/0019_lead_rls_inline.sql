-- Lead RLS inlined so owner/branch predicates can use indexes.
-- arth_lead_visible(id) remains for events and other tables that only have a lead id.

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
        WHEN 'mgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        WHEN 'lead' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL
            AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
          OR EXISTS (
            SELECT 1
            FROM users ru
            JOIN positions rp ON rp.id = ru.position_id
            WHERE ru.id = leads.owner_user_id
              AND rp.reports_to = NULLIF(current_setting('app.position_id', true), '')::uuid
          )
        WHEN 'tele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL
            AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'svctele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL
            AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'sales' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        ELSE arth_lead_row_visible(tenant_id, branch_id, owner_user_id, first_responded_at)
      END
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
