-- Create staff_advance_repayment table for tracking salary advance repayments
CREATE TABLE IF NOT EXISTS staff_advance_repayment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    branch_id BIGINT,
    advance_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    repayment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    month VARCHAR(7),
    status VARCHAR(20) DEFAULT 'PENDING',
    recorded_by BIGINT,
    remarks VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (advance_id) REFERENCES staff_advance(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,

    INDEX idx_advance_id (advance_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_status (status),
    INDEX idx_repayment_date (repayment_date)
);

-- Add totalRepaid column to staff_advance if it doesn't exist
ALTER TABLE staff_advance
ADD COLUMN IF NOT EXISTS total_repaid DECIMAL(15, 2) DEFAULT 0;
