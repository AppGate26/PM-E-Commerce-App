-- Supplier payments: money actually paid to a supplier, reducing what the business
-- owes them. Counterpart to goods_supplied (which debits the supplier ledger when
-- goods are received) - this credits it when the supplier is paid.
CREATE TABLE IF NOT EXISTS supplier_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    branch_id BIGINT,
    supplier_id BIGINT NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    invoice_number VARCHAR(100),
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,

    INDEX idx_supplier_payments_supplier_id (supplier_id),
    INDEX idx_supplier_payments_branch_id (branch_id),
    INDEX idx_supplier_payments_payment_date (payment_date)
);
