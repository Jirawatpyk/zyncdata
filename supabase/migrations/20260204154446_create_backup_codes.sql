CREATE TABLE backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTE: No updated_at column or trigger needed. Backup codes are immutable
-- after creation — only `used_at` changes from NULL to a timestamp (single write).

CREATE INDEX idx_backup_codes_user_id ON backup_codes(user_id);

ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own backup codes (insert, select, update, delete)
CREATE POLICY "Users manage own backup codes"
  ON backup_codes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
