-- Customer visibility inlined so phone/name indexes run first. A plpgsql
-- EXISTS on every customer row cannot serve a 20 lakh book.

DROP POLICY IF EXISTS tenant_isolation ON customers;
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      NULLIF(current_setting('app.role_key', true), '') IN ('owner', 'adv', 'admin', 'ops')
      OR NOT EXISTS (
        SELECT 1 FROM leads l
        WHERE l.customer_id = customers.id AND l.tenant_id = customers.tenant_id
      )
      OR EXISTS (
        SELECT 1 FROM leads l
        WHERE l.customer_id = customers.id
          AND l.tenant_id = customers.tenant_id
          AND (
            CASE NULLIF(current_setting('app.role_key', true), '')
              WHEN 'mgr' THEN
                l.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
              WHEN 'lead' THEN
                l.owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
                OR (
                  l.owner_user_id IS NULL
                  AND l.first_responded_at IS NULL
                  AND l.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
                )
                OR EXISTS (
                  SELECT 1
                  FROM users ru
                  JOIN positions rp ON rp.id = ru.position_id
                  WHERE ru.id = l.owner_user_id
                    AND rp.reports_to = NULLIF(current_setting('app.position_id', true), '')::uuid
                )
              WHEN 'tele' THEN
                l.owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
                OR (
                  l.owner_user_id IS NULL
                  AND l.first_responded_at IS NULL
                  AND l.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
                )
              WHEN 'svctele' THEN
                l.owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
                OR (
                  l.owner_user_id IS NULL
                  AND l.first_responded_at IS NULL
                  AND l.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
                )
              WHEN 'sales' THEN
                l.owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
              ELSE arth_lead_row_visible(
                l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at
              )
            END
          )
      )
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
