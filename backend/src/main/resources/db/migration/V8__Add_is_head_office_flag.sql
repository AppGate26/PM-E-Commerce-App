-- Head Office was previously identified everywhere by string-matching
-- branches.branch_code = 'HEAD_OFFICE'. That made it indistinguishable from an
-- ordinary branch at the data-model level: nothing stopped it being deactivated
-- (BranchService.deactivateBranch had no guard) and a second, disconnected
-- definition existed in BranchUserAssignmentService (null branch == "Head
-- Office"), which disagreed with the real access-control rule (null branch for
-- staff == denied, fail-closed).
--
-- This adds a real is_head_office flag as the single source of truth. Only
-- HeadOfficeBranchInitializer ever sets it true, and it is not on BranchDto, so
-- it cannot be flipped through the branch create/update API.
--
-- NOTE: Flyway is inert in this project (see V2/V3). Run this by hand against
-- the database. Hibernate's ddl-auto will usually have added the column already
-- (see application.yml, ddl-auto: update), and HeadOfficeBranchInitializer
-- self-heals the flag on every app startup regardless -- so this script is a
-- safety net, not the only path to a correct value.

ALTER TABLE branches ADD COLUMN is_head_office BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE branches SET is_head_office = TRUE WHERE branch_code = 'HEAD_OFFICE';

-- Post-run check: exactly one row should be flagged.
--   SELECT id, branch_code, branch_name FROM branches WHERE is_head_office = TRUE;
