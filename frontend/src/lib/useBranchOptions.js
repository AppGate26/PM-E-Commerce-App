import { useEffect, useState } from "react";
import { fetchBranches } from "./branchApi";
import { resolveBackendBranchId } from "./branchAccess";

/**
 * Loads the branch directory as report-picker options: [{ value, label }].
 *
 * `value` is the branch's real numeric backend id (as a string) so it can be
 * handed straight to apiRequest as an X-Branch-Id override; `label` combines the
 * branch code and name. Head Office is included and comes first (fetchBranches
 * already orders it that way), carrying its seeded numeric id.
 *
 * Used by the inventory report screens and the client customer report to let a
 * head-office user pull one branch's data without changing the global branch
 * scope of the rest of the app.
 */
export const useBranchOptions = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBranches()
      .then((list) => {
        if (cancelled) return;
        const mapped = list
          .map((branch) => {
            const value = resolveBackendBranchId(branch);
            if (value == null) return null;
            const label =
              [branch.branchCode, branch.branchName].filter(Boolean).join(" · ") ||
              branch.branchName ||
              "Branch";
            return { value: String(value), label };
          })
          .filter(Boolean);
        setOptions(mapped);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading };
};

export default useBranchOptions;
