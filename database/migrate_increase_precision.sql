-- Migration: Aumentar precisão das colunas amount de DECIMAL(10,2) para DECIMAL(15,2)
-- Isso permite valores até 9.999.999.999.999,99 (quase 10 trilhões)

ALTER TABLE expenses ALTER COLUMN amount TYPE DECIMAL(15, 2);
ALTER TABLE incomes ALTER COLUMN amount TYPE DECIMAL(15, 2);
ALTER TABLE invoice_items ALTER COLUMN amount TYPE DECIMAL(15, 2);
ALTER TABLE budgets ALTER COLUMN amount_limit TYPE DECIMAL(15, 2);
