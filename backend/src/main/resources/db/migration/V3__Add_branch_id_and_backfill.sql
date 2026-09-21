-- Branch scoping: add the branch_id column everywhere it is now needed, and
-- backfill existing rows so nothing disappears when scoping switches on.
--
-- NOTE: Flyway is inert in this project (see V2). Run this by hand against the
-- database. Hibernate's ddl-auto will usually have added the columns already, so
-- every ADD COLUMN below is written to be safe to re-run.
--
-- The rule being applied:
--   * TRANSACTIONAL data (orders, sales, journal, payroll, stock, cashier, returns)
--     is backfilled to the Head Office branch. It has to belong to someone, and
--     everything that exists today was in effect booked centrally. Leaving it NULL
--     would make it invisible to every branch user AND to head office reports that
--     filter by branch.
--   * SHARED REFERENCE data (products, suppliers, the chart of accounts) is
--     deliberately left NULL. NULL means "company-wide", which is exactly what the
--     existing catalogue is: every branch should keep seeing all of it.

-- ---------------------------------------------------------------------------
-- 0. Resolve the Head Office branch id once. It is seeded at startup by
--    HeadOfficeBranchInitializer with the stable code 'HEAD_OFFICE'.
-- ---------------------------------------------------------------------------
SET @head_office_id := (SELECT id FROM branches WHERE branch_code = 'HEAD_OFFICE' LIMIT 1);

-- Guard: if Head Office is missing, start the app once to seed it, then re-run.
-- (A NULL here would silently backfill nothing.)

-- ---------------------------------------------------------------------------
-- 1. Add the columns. Existing branch_id columns (stocks, sales_orders, orders,
--    invoices, warehouses, warehouse_movements, accounts, journal_entries,
--    cash_payments, loan_payments, deposit_transactions, customer_ledger) are
--    skipped -- they already exist.
-- ---------------------------------------------------------------------------

-- Accounting
ALTER TABLE transactions          ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE payments              ADD COLUMN branch_id BIGINT NULL;

-- Payroll (the module had no branch linkage at all)
ALTER TABLE staff                 ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE payroll_runs          ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE payroll_entries       ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE staff_advance         ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE salary_breakdowns     ADD COLUMN branch_id BIGINT NULL;

-- Inventory
ALTER TABLE products              ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE suppliers             ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE supplier_ledger       ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE goods_supplied        ADD COLUMN branch_id BIGINT NULL;

-- Sales / orders
ALTER TABLE return_requests       ADD COLUMN branch_id BIGINT NULL;

-- Wallet / payment
ALTER TABLE wallets               ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE disputes              ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE cashier_wallet_fundings ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE cashier_till_balances ADD COLUMN branch_id BIGINT NULL;

-- Clients
ALTER TABLE customers             ADD COLUMN branch_id BIGINT NULL;

-- Delivery
ALTER TABLE RiderDetails          ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE RiderBox              ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE delivery_confirmations ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE delivery_notifications ADD COLUMN branch_id BIGINT NULL;

-- Goods recovery
ALTER TABLE recovery_agents       ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE recovery_box          ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE recovery_items        ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE goods_recoveries      ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE recovery_notifications ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE loan_notifications    ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE reminders             ADD COLUMN branch_id BIGINT NULL;

-- Customer care
ALTER TABLE call_logs             ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE chat_conversations    ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE email_tickets         ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE care_escalations      ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE social_media_links    ADD COLUMN branch_id BIGINT NULL;

-- ---------------------------------------------------------------------------
-- 2. Backfill TRANSACTIONAL data to Head Office.
--    Only touches rows that have no branch yet, so this is safe to re-run and
--    will not clobber rows already tagged to a real branch (stocks, sales_orders,
--    orders, invoices and warehouses already carry real branch ids in places).
-- ---------------------------------------------------------------------------

-- Accounting: this is the one that matters most. accounts.branch_id and
-- journal_entries.branch_id existed but were NEVER written, so every branch
-- trial balance / P&L currently comes back empty.
UPDATE journal_entries      SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE transactions         SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE payments             SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Payroll
UPDATE staff                SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE payroll_runs         SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE payroll_entries      SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE staff_advance        SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE salary_breakdowns    SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Sales / orders / returns
UPDATE orders               SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE sales_orders         SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE return_requests      SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE invoices             SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Goods received
UPDATE goods_supplied       SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE supplier_ledger      SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Cashier: these four columns already existed but nothing ever read or wrote them.
UPDATE cash_payments        SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE loan_payments        SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE deposit_transactions SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE customer_ledger      SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Wallet / payment
UPDATE wallets                SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE disputes               SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE cashier_wallet_fundings SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE cashier_till_balances  SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Clients
UPDATE customers            SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Delivery
UPDATE RiderDetails         SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE RiderBox             SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE delivery_confirmations SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE delivery_notifications SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Goods recovery
UPDATE recovery_agents      SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE recovery_box         SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE recovery_items       SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE goods_recoveries     SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE recovery_notifications SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE loan_notifications   SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE reminders            SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- Customer care (social_media_links is deliberately excluded -- see section 3)
UPDATE call_logs            SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE chat_conversations   SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE email_tickets        SET branch_id = @head_office_id WHERE branch_id IS NULL;
UPDATE care_escalations     SET branch_id = @head_office_id WHERE branch_id IS NULL;

-- ---------------------------------------------------------------------------
-- 2b. Post existing staff to Head Office.
--
--     Scoping is fail-CLOSED: a non-admin, non-shopper user with NO branch is
--     denied on every request. Everyone who exists today predates branches and
--     was in effect head office, so post them there rather than locking them
--     out on deploy. Reassign individuals to real branches afterwards from
--     Admin > Security Setup > Create/Modify User.
-- ---------------------------------------------------------------------------
UPDATE users
   SET branch_id = @head_office_id
 WHERE branch_id IS NULL
   AND role NOT IN ('SUPER_ADMIN', 'ADMIN', 'USER');

-- ---------------------------------------------------------------------------
-- 3. NOT backfilled, on purpose:
--
--    products, suppliers, accounts
--       NULL = company-wide. Every branch must keep seeing the existing catalogue
--       and chart of accounts. Setting these to Head Office would hide them from
--       every branch user.
--
--    stocks
--       NULL already means "central/HQ stock" in the existing code
--       (StockService.createStock, allocateStockToBranch). Backfilling it would
--       turn the central pool into Head Office branch stock and break allocation.
--
--    social_media_links
--       Same shared rule: these are the company's own handles and every branch
--       should keep seeing them.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3b. cashier_till_balances: the uniqueness rule changed.
--
--     It used to be UNIQUE(cashier, till_box), which would stop a second branch
--     from ever opening a till with the same name. It is now
--     UNIQUE(cashier, till_box, branch_id). Hibernate will add the new
--     constraint but will NOT drop the old one, so drop it by hand.
--     Find its real name first:
--
--       SHOW INDEX FROM cashier_till_balances;
--
--     then, for the two-column one:
--
--       ALTER TABLE cashier_till_balances DROP INDEX <old_constraint_name>;
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4. Indexes. Every scoped read now filters on branch_id.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_journal_entries_branch  ON journal_entries(branch_id);
CREATE INDEX idx_transactions_branch     ON transactions(branch_id);
CREATE INDEX idx_payments_branch         ON payments(branch_id);
CREATE INDEX idx_staff_branch            ON staff(branch_id);
CREATE INDEX idx_payroll_runs_branch     ON payroll_runs(branch_id);
CREATE INDEX idx_payroll_entries_branch  ON payroll_entries(branch_id);
CREATE INDEX idx_staff_advance_branch    ON staff_advance(branch_id);
CREATE INDEX idx_orders_branch           ON orders(branch_id);
CREATE INDEX idx_sales_orders_branch     ON sales_orders(branch_id);
CREATE INDEX idx_return_requests_branch  ON return_requests(branch_id);
CREATE INDEX idx_invoices_branch         ON invoices(branch_id);
CREATE INDEX idx_stocks_branch           ON stocks(branch_id);
CREATE INDEX idx_products_branch         ON products(branch_id);
CREATE INDEX idx_suppliers_branch        ON suppliers(branch_id);
CREATE INDEX idx_goods_supplied_branch   ON goods_supplied(branch_id);
CREATE INDEX idx_wallets_branch          ON wallets(branch_id);
CREATE INDEX idx_disputes_branch         ON disputes(branch_id);
CREATE INDEX idx_cashier_fundings_branch ON cashier_wallet_fundings(branch_id);
CREATE INDEX idx_customers_branch        ON customers(branch_id);
CREATE INDEX idx_riderdetails_branch     ON RiderDetails(branch_id);
CREATE INDEX idx_riderbox_branch         ON RiderBox(branch_id);
CREATE INDEX idx_recovery_agents_branch  ON recovery_agents(branch_id);
CREATE INDEX idx_recovery_box_branch     ON recovery_box(branch_id);
CREATE INDEX idx_goods_recoveries_branch ON goods_recoveries(branch_id);
CREATE INDEX idx_call_logs_branch        ON call_logs(branch_id);
CREATE INDEX idx_chat_convos_branch      ON chat_conversations(branch_id);
CREATE INDEX idx_email_tickets_branch    ON email_tickets(branch_id);
CREATE INDEX idx_care_escalations_branch ON care_escalations(branch_id);
CREATE INDEX idx_delivery_notifs_branch  ON delivery_notifications(branch_id);
CREATE INDEX idx_recovery_notifs_branch  ON recovery_notifications(branch_id);
CREATE INDEX idx_loan_notifs_branch      ON loan_notifications(branch_id);
CREATE INDEX idx_reminders_branch        ON reminders(branch_id);

-- ---------------------------------------------------------------------------
-- 5. Post-deploy check: confirm nobody is locked out.
--
--    Scoping is fail-CLOSED. Any non-admin, non-shopper user with no branch is
--    denied on every request. Step 2b posts them all to Head Office, so this
--    should come back EMPTY. If it does not, post whoever it returns:
--
--      SELECT id, email, role FROM users
--       WHERE branch_id IS NULL
--         AND role NOT IN ('SUPER_ADMIN', 'ADMIN', 'USER');
--
--    (Role USER is excluded: those are self-registered shoppers, who are exempt
--    from branch scoping by design.)
-- ---------------------------------------------------------------------------
