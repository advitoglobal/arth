-- Restore the overdue first-response row so Today is not empty after test dispositions.
UPDATE leads
SET next_action_at = now() - interval '1 hour',
    lost_reason_key = NULL
WHERE id = 'ffffffff-ffff-ffff-ffff-fffffffffff1';
