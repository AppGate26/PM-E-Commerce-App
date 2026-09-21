-- Fixes: "Data truncated for column 'permission' at row 1"
--        [insert into user_permissions (user_id, permission) values (?, ?)]
-- and the same failure on users.role.
--
-- ROOT CAUSE: both columns were created as MySQL ENUM types, not VARCHAR:
--   user_permissions.permission
--     enum('INVENTORY','CLIENT','ORDERING_SALES','ACCOUNTING','PAYMENT','CARE',
--          'RECOVERY','DELIVERY','CASHIER_STAND','WAREHOUSE','MAIL_MESSENGER')
--   users.role
--     enum('SUPER_ADMIN','ADMIN','USER','RIDER','RECOVERY_AGENT')
--
-- In MySQL, inserting a value that is not in an ENUM's allowed list raises
-- "Data truncated for column ...". It is NOT a length problem.
--   * PermissionEnum gained BRANCH        -> not in the ENUM list -> merge-role fails.
--   * RoleEnum has BRANCH_MANAGER and WAREHOUSE_MANAGER -> not in the ENUM list ->
--     creating/modifying a branch or warehouse user fails.
--
-- The entities map these with @Enumerated(EnumType.STRING), which expects VARCHAR.
-- Converting to VARCHAR realigns the schema with the mapping and means future enum
-- constants need no further migration. ENUM values are stored as their string
-- labels, so this conversion preserves all existing rows.
--
-- Both columns are currently nullable; that is preserved deliberately (forcing
-- NOT NULL would fail if any row is NULL and is an unrelated behaviour change).
--
-- NOTE: Flyway is NOT on the classpath in this project, so this file is NOT run
-- automatically. Run it directly against the pomstores database, e.g.:
--   mysql -h <host> -u <user> -p pomstores < V2__Widen_user_permissions_permission_column.sql

ALTER TABLE user_permissions MODIFY COLUMN permission VARCHAR(50) NULL;

ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NULL;
