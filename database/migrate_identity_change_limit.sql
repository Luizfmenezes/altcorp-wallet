-- Migration: adiciona controle de cooldown para alterações de nome/username

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_identity_change_at TIMESTAMPTZ;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'last_identity_change_at';
