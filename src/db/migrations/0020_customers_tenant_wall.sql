-- Enquiry walls stay on leads. Customer RLS is dealer-scoped so phone/name
-- indexes can run. Search still joins leads, so another telecaller's owned
-- enquiry does not appear. Another dealer never appears.

DROP POLICY IF EXISTS tenant_isolation ON customers;
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
