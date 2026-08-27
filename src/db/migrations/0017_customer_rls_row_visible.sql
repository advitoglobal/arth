-- Customer RLS must not call arth_lead_visible(id) (a second leads lookup) on every row.

DROP POLICY IF EXISTS tenant_isolation ON customers;
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      NULLIF(current_setting('app.role_key', true), '') IN ('owner', 'adv', 'admin', 'ops')
      OR NOT EXISTS (SELECT 1 FROM leads l WHERE l.customer_id = customers.id)
      OR EXISTS (
        SELECT 1 FROM leads l
        WHERE l.customer_id = customers.id
          AND arth_lead_row_visible(
            l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at
          )
      )
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
