-- Add weight_kg column to products table for weight-based delivery fee calculation
ALTER TABLE products ADD COLUMN weight_kg DECIMAL(10, 3) DEFAULT NULL;

-- Add comment explaining the column
ALTER TABLE products MODIFY weight_kg DECIMAL(10, 3) DEFAULT NULL COMMENT 'Product weight in kilograms (e.g., 2.5 kg for 2.5 kilograms)';
