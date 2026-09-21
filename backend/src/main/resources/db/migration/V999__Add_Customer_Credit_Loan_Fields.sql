-- Add creditLimit, loanBalance, and loanDueDate columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DOUBLE PRECISION DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loan_balance DOUBLE PRECISION DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loan_due_date DATE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_credit_limit ON customers(credit_limit);
CREATE INDEX IF NOT EXISTS idx_customers_loan_balance ON customers(loan_balance);
CREATE INDEX IF NOT EXISTS idx_customers_loan_due_date ON customers(loan_due_date);
