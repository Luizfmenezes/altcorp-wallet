-- Migration: Auth System Overhaul
-- Adiciona suporte a verificação de email, Google OAuth, e reset de senha

-- Criar enum para tipo de código de verificação
DO $$ BEGIN
    CREATE TYPE verification_type AS ENUM ('email_verify', 'password_reset');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar novos campos na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Tornar email obrigatório para novos registros (manter nullable para usuários antigos)
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL; -- Não forçar para não quebrar existentes

-- Criar tabela de códigos de verificação
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type verification_type NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Atualizar usuários existentes como email verificado (se têm email)
UPDATE users SET email_verified = TRUE WHERE email IS NOT NULL AND email != '';
