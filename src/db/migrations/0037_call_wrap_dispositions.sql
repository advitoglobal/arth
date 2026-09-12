-- Connected outcomes that demand a fact. Additive.

INSERT INTO config_dispositions (
  tenant_id, key, label, connected, requires_revisit, requires_lost_reason, sort_order, department_key
)
SELECT t.id, d.key, d.label, d.connected, d.revisit, d.lost, d.sort, d.dept
FROM tenants t
CROSS JOIN (VALUES
  ('meeting_booked', 'Meeting booked', true, false, false, 6, 'sales'),
  ('testdrive_booked', 'Test drive booked', true, false, false, 7, 'sales'),
  ('quotation_sent', 'Quotation sent', true, false, false, 8, 'sales')
) AS d(key, label, connected, revisit, lost, sort, dept)
ON CONFLICT (tenant_id, key) DO NOTHING;
