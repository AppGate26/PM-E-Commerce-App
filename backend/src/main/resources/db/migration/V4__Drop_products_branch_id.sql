-- Products are now a universal catalogue: any branch can create or edit any
-- product, and nothing about a product is ever branch-scoped. Drop the
-- branch_id column added by V3 (it was already always NULL by convention --
-- see V3 section 3 -- but branch-scoped writes could set it on create, which
-- wrongly hid a product from every other branch).
--
-- NOTE: Flyway is inert in this project (see V2/V3). Run this by hand against
-- the database.

ALTER TABLE products DROP INDEX idx_products_branch;
ALTER TABLE products DROP COLUMN branch_id;
