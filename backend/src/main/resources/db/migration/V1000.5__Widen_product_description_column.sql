-- Fixes: product registration silently truncating/rejecting longer descriptions.
-- ROOT CAUSE: products.product_description was created as the Hibernate default
-- VARCHAR(255), but ProductDto validates up to 2000 characters
-- (@Size(min = 10, max = 2000)). Any description over 255 chars would fail at the
-- database rather than being accepted as the DTO validation implies.
-- Widen the column to match Product.java's @Column(length = 2000).
ALTER TABLE products MODIFY COLUMN product_description VARCHAR(2000) NULL;
