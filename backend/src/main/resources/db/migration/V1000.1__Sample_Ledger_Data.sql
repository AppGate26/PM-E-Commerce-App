-- Sample customer ledger data for testing
-- This adds transactions for customer account 0000000000 (orifa princess)

INSERT IGNORE INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance)
SELECT c.id, c.account_number, CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.surname,'')), DATE_SUB(CURDATE(), INTERVAL 28 DAY), 'Wallet Balance - Initial Credit', 'WB-001', 0, 5000, 5000
FROM customers c WHERE c.account_number = '0000000000' LIMIT 1;

INSERT IGNORE INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance)
SELECT c.id, c.account_number, CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.surname,'')), DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'Loan Disbursement', 'LOAN-001', 10000, 0, -5000
FROM customers c WHERE c.account_number = '0000000000' LIMIT 1;

INSERT IGNORE INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance)
SELECT c.id, c.account_number, CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.surname,'')), DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Loan Payment', 'PAY-001', 0, 2000, -3000
FROM customers c WHERE c.account_number = '0000000000' LIMIT 1;

INSERT IGNORE INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance)
SELECT c.id, c.account_number, CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.surname,'')), DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Interest Accrual', 'INT-001', 500, 0, -3500
FROM customers c WHERE c.account_number = '0000000000' LIMIT 1;

INSERT IGNORE INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance)
SELECT c.id, c.account_number, CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.surname,'')), DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Loan Repayment', 'REP-001', 0, 3000, -500
FROM customers c WHERE c.account_number = '0000000000' LIMIT 1;

INSERT IGNORE INTO customer_ledger (customer_id, account_number, account_name, transaction_date, transaction_details, ref_no, debit_amount, credit_amount, balance)
SELECT c.id, c.account_number, CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.surname,'')), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Wallet Deposit', 'DEP-001', 0, 2000, 1500
FROM customers c WHERE c.account_number = '0000000000' LIMIT 1;
