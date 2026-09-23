-- Every GL (account_details) and every product now belongs to a branch.
--
-- account_details.branch_id: the branch that owns the GL. The Account Details page
--   shows only the logged-in user's branch (see AccountDetailsService).
-- account_details.gl_purpose: optional role the GL plays in automatic postings
--   (PAYSTACK, SALES_REVENUE, CUSTOMER_WALLET - see GlPostingService). At most one
--   GL per (branch, purpose); rows with no purpose (NULL) are unconstrained.
-- products.branch_id: re-added (V4 dropped it). Branch staff create products for
--   their own branch; everything else, including every online product, belongs to
--   Head Office.
--
-- Existing rows are backfilled to the Head Office branch. On a brand-new database
-- the Head Office row doesn't exist until HeadOfficeBranchInitializer runs, so the
-- backfill simply touches nothing there.

ALTER TABLE account_details ADD COLUMN IF NOT EXISTS branch_id BIGINT NULL;
ALTER TABLE account_details ADD COLUMN IF NOT EXISTS gl_purpose VARCHAR(40) NULL;
CREATE INDEX IF NOT EXISTS idx_account_details_branch ON account_details (branch_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_account_details_branch_purpose ON account_details (branch_id, gl_purpose);

UPDATE account_details
SET branch_id = (SELECT id FROM branches WHERE is_head_office = TRUE LIMIT 1)
WHERE branch_id IS NULL;

-- The paired posting rows in `accounts` are deliberately left alone: a NULL branch
-- there means company-wide, and existing GLs must stay selectable by every branch's
-- journal forms. Only GLs created from now on carry their branch into `accounts`.

ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id BIGINT NULL;
CREATE INDEX IF NOT EXISTS idx_products_branch ON products (branch_id);

UPDATE products
SET branch_id = (SELECT id FROM branches WHERE is_head_office = TRUE LIMIT 1)
WHERE branch_id IS NULL;
