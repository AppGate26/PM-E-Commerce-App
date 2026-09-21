// The branch a head-office / admin user is currently "acting as".
//
// Only meaningful for callers the backend treats as unrestricted (admin, super
// admin, or a user posted to Head Office). For them, sending this branch id as the
// X-Branch-Id header narrows every request to that one branch — see
// BranchContextFilter on the backend. A user pinned to a real branch ignores it
// entirely (the backend never reads the header on the scoped path), so a stray
// value here can never widen anyone's view.
//
// Persisted in localStorage so the selection survives reloads. It is deliberately
// NOT tied to a single React tree: the plain API client (lib/config.js) reads it
// on every request without importing React.

const ACTIVE_BRANCH_KEY = "pm_active_branch";

// Change events dispatch on this so the (rare) listener can react; the switcher
// itself reloads the page on change, so most code just reads the value.
export const ACTIVE_BRANCH_CHANGED_EVENT = "pm-active-branch-changed";

// The numeric branch id currently selected, or "" when viewing all branches.
export const getActiveBranchId = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_BRANCH_KEY);
    return raw && raw.trim() ? raw.trim() : "";
  } catch {
    return "";
  }
};

// Persist a selection. Pass a falsy value (or the "all branches" sentinel) to
// clear it and return to the full, unrestricted view.
export const setActiveBranchId = (branchId) => {
  try {
    if (branchId === null || branchId === undefined || branchId === "") {
      localStorage.removeItem(ACTIVE_BRANCH_KEY);
    } else {
      localStorage.setItem(ACTIVE_BRANCH_KEY, String(branchId));
    }
    window.dispatchEvent(new Event(ACTIVE_BRANCH_CHANGED_EVENT));
  } catch {
    // Storage can be unavailable (private mode); the header simply won't be sent.
  }
};

export const clearActiveBranchId = () => setActiveBranchId("");
