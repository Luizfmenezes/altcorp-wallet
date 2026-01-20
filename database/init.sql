-- AltCorp Wallet Database Schema
-- PostgreSQL Database Initialization Script

-- Create enum types
CREATE TYPE income_type AS ENUM ('fixed', 'extra');
CREATE TYPE card_type AS ENUM ('credit', 'debit', 'bank');
CREATE TYPE frequency_type AS ENUM ('monthly', 'weekly');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type income_type NOT NULL,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date VARCHAR(10) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency frequency_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type card_type NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    date VARCHAR(10) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency frequency_type,
    installment_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    limit DECIMAL(10, 2) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, month, year)
);

-- Create indexes for better performance
CREATE INDEX idx_incomes_user_id ON incomes(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_invoice_items_card_id ON invoice_items(card_id);
CREATE INDEX idx_invoice_items_date ON invoice_items(date);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);

-- Insert default user for testing (password: admin123)
INSERT INTO users (email, name, hashed_password)
VALUES (
    'admin@altcorp.com',
    'Admin User',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeUu5d4SXEIu'
) ON CONFLICT (email) DO NOTHING;

-- Get the user id
DO $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'admin@altcorp.com';
    
    -- Insert sample incomes
    INSERT INTO incomes (user_id, description, amount, type)
    VALUES 
        (v_user_id, 'Salário', 5000.00, 'fixed'),
        (v_user_id, 'Freelance', 1500.00, 'extra')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample expenses
    INSERT INTO expenses (user_id, date, description, category, amount, owner)
    VALUES 
        (v_user_id, '2026-01-03', 'Mercado', 'Alimentação', 320.00, 'Eu'),
        (v_user_id, '2026-01-05', 'Uber', 'Transporte', 45.50, 'Eu'),
        (v_user_id, '2026-01-08', 'Farmácia', 'Saúde', 89.90, 'Ana')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample cards
    INSERT INTO cards (user_id, name, type, color)
    VALUES 
        (v_user_id, 'Cartão Nubank', 'credit', '#8B5CF6'),
        (v_user_id, 'Conta Itaú', 'bank', '#F97316')
    ON CONFLICT DO NOTHING;
END $$;

COMMIT;
