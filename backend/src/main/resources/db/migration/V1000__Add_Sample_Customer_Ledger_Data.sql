-- Add sample customer ledger transactions for testing
-- Get the customer ID from the account number "0000000000" (orifa princess)
INSERT INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance, created_at, updated_at)
SELECT
    c.id,
    c.account_number,
    CONCAT(c.first_name, ' ', c.surname),
    DATE_SUB(NOW(), INTERVAL 28 DAY),
    'Wallet Balance - Initial',
    'WB-001',
    NULL,
    5000.00,
    5000.00,
    NOW(),
    NOW()
FROM customers c
WHERE c.account_number = '0000000000'
LIMIT 1;

-- Add more sample transactions
INSERT INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance, created_at, updated_at)
SELECT
    c.id,
    c.account_number,
    CONCAT(c.first_name, ' ', c.surname),
    DATE_SUB(NOW(), INTERVAL 25 DAY),
    'Loan Disbursement',
    'LOAN-001',
    10000.00,
    NULL,
    -5000.00,
    NOW(),
    NOW()
FROM customers c
WHERE c.account_number = '0000000000'
LIMIT 1;

-- Payment/Deposit
INSERT INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance, created_at, updated_at)
SELECT
    c.id,
    c.account_number,
    CONCAT(c.first_name, ' ', c.surname),
    DATE_SUB(NOW(), INTERVAL 20 DAY),
    'Payment/Deposit',
    'PAY-001',
    NULL,
    2000.00,
    -3000.00,
    NOW(),
    NOW()
FROM customers c
WHERE c.account_number = '0000000000'
LIMIT 1;

-- Loan Interest
INSERT INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance, created_at, updated_at)
SELECT
    c.id,
    c.account_number,
    CONCAT(c.first_name, ' ', c.surname),
    DATE_SUB(NOW(), INTERVAL 15 DAY),
    'Loan Interest Accrual',
    'INT-001',
    500.00,
    NULL,
    -3500.00,
    NOW(),
    NOW()
FROM customers c
WHERE c.account_number = '0000000000'
LIMIT 1;

-- Another Payment
INSERT INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance, created_at, updated_at)
SELECT
    c.id,
    c.account_number,
    CONCAT(c.first_name, ' ', c.surname),
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    'Loan Repayment',
    'REP-001',
    NULL,
    3000.00,
    -500.00,
    NOW(),
    NOW()
FROM customers c
WHERE c.account_number = '0000000000'
LIMIT 1;

-- Update customer with balance info
UPDATE customers c
SET
    c.wallet_balance = 2000.00,
    c.loan_balance = 7000.00,
    c.loan_accrued_interest = 500.00
WHERE c.account_number = '0000000000';
