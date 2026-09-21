package com.appGate.rbac.init;

import com.appGate.rbac.enums.BranchStatusEnum;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.repository.BranchRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Ensures a single, well-known "Head Office" branch always exists.
 *
 * Head Office is treated as a real {@link Branch} row (not a frontend-only
 * sentinel), so users can be assigned to it just like any other branch. The
 * row is located by its stable {@link #HEAD_OFFICE_BRANCH_CODE}; creation is
 * idempotent, so this runner is safe on every startup.
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class HeadOfficeBranchInitializer implements CommandLineRunner {

    /** Stable, unique code used to locate the Head Office branch. */
    public static final String HEAD_OFFICE_BRANCH_CODE = "HEAD_OFFICE";

    private static final Logger logger = LoggerFactory.getLogger(HeadOfficeBranchInitializer.class);

    private final BranchRepository branchRepository;

    @Override
    public void run(String... args) {
        // If some branch already carries the flag, leave it alone -- an admin may
        // have moved Head Office to a different branch via BranchService.setHeadOffice,
        // and re-flagging the originally-seeded HEAD_OFFICE-coded row here would
        // silently undo that move on every restart.
        if (branchRepository.findByHeadOfficeTrue().isPresent()) {
            return;
        }
        branchRepository.findByBranchCode(HEAD_OFFICE_BRANCH_CODE).ifPresentOrElse(
                this::ensureFlagged,
                this::createHeadOfficeBranch);
    }

    private void createHeadOfficeBranch() {
        Branch headOffice = new Branch();
        headOffice.setBranchCode(HEAD_OFFICE_BRANCH_CODE);
        headOffice.setBranchName("Head Office");
        headOffice.setStatus(BranchStatusEnum.ACTIVE);
        headOffice.setHeadOffice(true);
        Branch saved = branchRepository.save(headOffice);
        logger.info("Seeded Head Office branch (id={}, code={})", saved.getId(), saved.getBranchCode());
    }

    /**
     * Self-heals deployments where the row was seeded before {@code is_head_office}
     * existed (Flyway is inert here, so a hand-run migration is easy to miss).
     * Runs every startup; a no-op once the flag is set.
     */
    private void ensureFlagged(Branch branch) {
        if (branch.isHeadOffice()) {
            logger.debug("Head Office branch already present (id={})", branch.getId());
            return;
        }
        branch.setHeadOffice(true);
        branchRepository.save(branch);
        logger.info("Backfilled is_head_office=true on existing Head Office branch (id={})", branch.getId());
    }
}
