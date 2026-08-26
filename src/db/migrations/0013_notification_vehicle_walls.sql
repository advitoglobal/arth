-- Notifications: you may write a notice for another seat at this dealer (handoff).
-- You may not read theirs. You may not address a seat at another dealer.
-- Vehicles follow the same customer wall as enquiries.

DROP POLICY IF EXISTS tenant_isolation ON notifications;
CREATE POLICY tenant_isolation ON notifications
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
        AND u.tenant_id = notifications.tenant_id
        AND u.is_active
    )
  );

DROP POLICY IF EXISTS tenant_isolation ON vehicles;
CREATE POLICY tenant_isolation ON vehicles
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      customer_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM leads l WHERE l.customer_id = vehicles.customer_id)
      OR EXISTS (
        SELECT 1 FROM leads l
        WHERE l.customer_id = vehicles.customer_id
          AND arth_lead_visible(l.id)
      )
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
