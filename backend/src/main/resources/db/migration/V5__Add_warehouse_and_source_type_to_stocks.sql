-- Add warehouse_id and source_type columns to stocks table
-- Allows stock to come from either a supplier or a warehouse

ALTER TABLE stocks ADD COLUMN warehouse_id BIGINT;
ALTER TABLE stocks ADD COLUMN source_type VARCHAR(50) DEFAULT 'supplier';

-- Add foreign key constraint for warehouse_id (optional, depending on warehouse table structure)
-- ALTER TABLE stocks ADD CONSTRAINT fk_stocks_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);
