import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import {
  cacheSecurityUser,
  DEFAULT_SECURITY_QUESTIONS,
  DEFAULT_SECURITY_ROLES,
  fetchSecurityQuestions,
  fetchSecurityRoles,
  fetchSecurityUsers,
} from "../shared/securityUtils";
import { apiRequest } from "../../../../lib/config";
import { upsertMessengerUser, upsertMessengerUsers } from "../../../../lib/internalMessenger";
import {
  getRegisteredDisplayNameOverride,
  setRegisteredDisplayName,
} from "../../../../lib/registeredUsers";
import {
  getBranchLabel,
  HEAD_OFFICE_ID,
  resolveBackendBranchId,
} from "../../../../lib/branchAccess";
import { fetchBranches } from "../../../../lib/branchApi";

const buildAutoUserCode = () => {
  const timeSuffix = Date.now().toString().slice(-5).padStart(5, "0");
  return `PM-USER-${timeSuffix}`;
};

const buildFallbackPhoneNumber = () => `080${Date.now().toString().slice(-8)}`;

const addIfPresent = (body, key, value) => {
  const cleanValue = typeof value === "string" ? value.trim() : value;
  if (cleanValue) {
    body[key] = cleanValue;
  }
};

const buildNameFromEmail = (email = "") => {
  const localPart = String(email).split("@")[0] || "user";
  const cleanName = localPart
    .replace(/[._-]+/g, " ")
    .replace(/[^a-z0-9 ]/gi, " ")
    .trim();

  const [firstName = "User", ...rest] = cleanName.split(/\s+/).filter(Boolean);

  return {
    firstName,
    lastName: rest.join(" ") || "Account",
  };
};

const createUserErrorMessage = (error) => {
  if (error?.status === 403) {
    return "Forbidden: the backend rejected this user-management request. Sign in with a backend ADMIN or SUPER_ADMIN account, or create the user through the public signup fallback.";
  }

  if (error?.status === 401) {
    return "Unauthorized: your login session is not valid. Please log out, sign in again, and retry.";
  }

  if (error?.status === 400) {
    // Surface the backend's validation message (e.g. "Branch is required...",
    // "User with this email already exists") rather than a generic failure.
    return error?.message
      ? `The backend rejected this user: ${error.message}`
      : "The backend rejected this user. Check the email, role, branch, and password fields.";
  }

  return error?.message || "Failed to submit user details.";
};

const normalizeBackendUser = (payload) => payload?.response || payload?.data || payload;

const getUserByEmail = async (email) => {
  const payload = await apiRequest(
    `/admin/security/users/email?email=${encodeURIComponent(email)}`,
    "GET"
  );

  return normalizeBackendUser(payload);
};

const assignBackendRole = async ({ email, role, userId }) => {
  if (!role || role === "USER") return;

  const requests = [
    {
      url: "/admin/security/users/role",
      method: "PUT",
      body: { email, attachRoles: [role] },
    },
    {
      url: "/admin/security/users/role",
      method: "PUT",
      body: { email, role },
    },
    userId
      ? {
          url: `/admin/security/users/${userId}/role`,
          method: "PUT",
          body: { role },
        }
      : null,
    userId
      ? {
          url: `/admin/security/users/${userId}`,
          method: "PUT",
          body: { email, role },
        }
      : null,
  ].filter(Boolean);

  let lastError = null;

  for (const request of requests) {
    try {
      await apiRequest(request.url, request.method, request.body);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to assign role to user.");
};

const fallbackSignUpUser = async ({ email, password, phoneNumber, name, userCode }) => {
  const { firstName, lastName } = buildNameFromEmail(email);

  return apiRequest(
    "/users/sign-up",
    "POST",
    {
      email,
      password,
      name,
      username: name,
      userName: name,
      userCode,
      firstName,
      lastName,
      phoneNumber: phoneNumber || buildFallbackPhoneNumber(),
    },
    false
  );
};

const CreateModifyUser = () => {
  const [mode, setMode] = useState("create");
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [userCode, setUserCode] = useState("");
  const [userRole, setUserRole] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [roles, setRoles] = useState(DEFAULT_SECURITY_ROLES);
  const [questions, setQuestions] = useState(DEFAULT_SECURITY_QUESTIONS);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(HEAD_OFFICE_ID);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadedUserId, setLoadedUserId] = useState(null);

  useEffect(() => {
    const loadOptions = async () => {
      const [roleResult, questionRows, userRows] = await Promise.all([
        fetchSecurityRoles()
          .then((roles) => ({ roles, error: null }))
          .catch((error) => ({ roles: [], error })),
        fetchSecurityQuestions().catch(() => []),
        fetchSecurityUsers().catch(() => []),
      ]);
      const roleRows = roleResult.roles;
      setRoles(roleRows.filter(Boolean));
      setQuestions(questionRows.filter(Boolean));
      setUsers(userRows.filter(Boolean));
      fetchBranches().then(setBranches).catch(() => setBranches([]));
      upsertMessengerUsers(userRows);
      if (roleResult.error) {
        setError(roleResult.error?.message || "Unable to load roles from backend.");
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    setUserCode(buildAutoUserCode());
  }, [mode]);

  const selectedUser = useMemo(
    () => users.find((user) => user.email === email),
    [users, email]
  );

  const selectedBranch = useMemo(
    () =>
      branches.find((branch) => branch.id === branchId) ||
      branches.find((branch) => branch.id === HEAD_OFFICE_ID),
    [branches, branchId]
  );

  const getRegisteredUserCode = (user = {}) =>
    user?.userCode ||
    user?.user_code ||
    user?.code ||
    user?.raw?.userCode ||
    user?.raw?.user_code ||
    user?.raw?.code ||
    "";

  const resetForm = () => {
    setEmail("");
    setName("");
    setPhoneNumber("");
    setPassword("");
    setVerifyPassword("");
    setUserCode("");
    setUserRole("");
    setQuestion("");
    setAnswer("");
    setBranchId(HEAD_OFFICE_ID);
    setLoadedUserId(null);
  };

  const applyUserBranch = (selectedEmail = "", user = {}) => {
    // Branch membership comes from the backend user record (User.branch).
    setBranchId(
      user?.raw?.branch?.id ||
        user?.raw?.branchId ||
        user?.branchId ||
        HEAD_OFFICE_ID
    );
  };

  const handleLoadUser = async (selectedEmail = email, fallbackUser = selectedUser) => {
    if (!selectedEmail.trim()) {
      setError("Select the user you want to modify.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = await apiRequest(
        `/admin/security/users/email?email=${encodeURIComponent(selectedEmail)}`,
        "GET"
      );
      const user = payload?.response || payload?.data || payload;

      if (!user?.id) {
        throw new Error("User not found.");
      }

      setMode("modify");
      setLoadedUserId(user.id);
      setEmail(user.email || "");
      setName(
        getRegisteredDisplayNameOverride(user.email || selectedEmail) ||
          fallbackUser?.name ||
          fallbackUser?.fullName ||
          user.name ||
          user.fullName ||
          user.username ||
          user.userName ||
          ""
      );
      setUserRole(user.role || "");
      setUserCode(getRegisteredUserCode(user) || getRegisteredUserCode(fallbackUser) || userCode);
      setQuestion(user.securityQuestion || user.question || "");
      setAnswer(user.securityAnswer || user.answer || "");
      applyUserBranch(selectedEmail, user);
      setSuccess(`User loaded successfully: ${user.email}`);
    } catch (loadError) {
      setLoadedUserId(null);
      setError(loadError?.message || "Unable to load user by email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (mode === "create" && !password) {
      setError("Password is required for a new user.");
      return;
    }

    if (password && password !== verifyPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!userRole) {
      setError("Please select a role.");
      return;
    }

    // The backend requires a numeric branch for every non-SUPER_ADMIN user.
    // Catch it here so we give an actionable message instead of a raw 400.
    const normalizedRole = userRole.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (
      mode === "create" &&
      normalizedRole !== "SUPER_ADMIN" &&
      resolveBackendBranchId(selectedBranch) == null
    ) {
      setError(
        "Select a valid branch for this user. Only a SUPER_ADMIN can be created without a branch. If the branch list is empty, wait for branches to load (or create a branch first) and try again."
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const baseBody = {
        email: email.trim(),
        name: name.trim(),
        role: userRole.trim().toUpperCase().replace(/[\s-]+/g, "_"),
      };
      baseBody.username = baseBody.name;
      baseBody.userName = baseBody.name;

      if (password) {
        baseBody.password = password.trim();
      }

      if (mode === "modify" && loadedUserId) {
        const body = { ...baseBody };
        addIfPresent(body, "verifyPassword", verifyPassword || password);
        addIfPresent(body, "userCode", userCode);
        addIfPresent(
          body,
          "department",
          selectedUser?.department && selectedUser.department !== "N/A"
            ? selectedUser.department
            : ""
        );
        addIfPresent(body, "securityQuestion", question);
        addIfPresent(body, "securityAnswer", answer);

        // Persist the user's branch on the backend (User.branch). Head Office
        // resolves to its seeded branch via `backendId`; omitted only when no
        // real backend id is available.
        const numericBranchId = resolveBackendBranchId(selectedBranch);
        if (numericBranchId != null) {
          body.branchId = numericBranchId;
        }

        const localUpdatedUser = {
          id: loadedUserId,
          email: baseBody.email,
          name: baseBody.name,
          username: baseBody.name,
          userName: baseBody.name,
          role: baseBody.role,
          userCode,
          branchId: selectedBranch?.id || HEAD_OFFICE_ID,
          branchName: getBranchLabel(selectedBranch),
          locationType: selectedBranch?.id === HEAD_OFFICE_ID ? "HEAD_OFFICE" : "BRANCH",
          firstName: selectedUser?.firstName || "",
          lastName: selectedUser?.lastName || "",
        };

        cacheSecurityUser(localUpdatedUser);
        setRegisteredDisplayName(baseBody.email, baseBody.name);
        upsertMessengerUser(localUpdatedUser);

        await apiRequest(`/admin/security/users/${loadedUserId}`, "PUT", body);
        const successMessage = `User updated successfully: ${email}`;
        setSuccess(successMessage);
        toast.success(successMessage);
        setUsers((current) =>
          current.map((user) =>
            user.id === loadedUserId
              ? {
                  ...user,
                  email,
                  name: baseBody.name,
                  username: baseBody.name,
                  role: userRole,
                  userCode: body.userCode || user.userCode,
                  branchId: selectedBranch?.id || HEAD_OFFICE_ID,
                  branchName: getBranchLabel(selectedBranch),
                }
              : user
          )
        );
      } else {
        // Backend requires a numeric branchId for every non-SUPER_ADMIN user.
        // Resolve the selected branch to its real backend id (Head Office now
        // maps to the seeded branch via its `backendId`); only send it when a
        // real numeric id is available.
        const numericBranchId = resolveBackendBranchId(selectedBranch);
        const adminCreateBody = {
          email: baseBody.email,
          name: baseBody.name,
          username: baseBody.name,
          userName: baseBody.name,
          userCode,
          password: baseBody.password,
          role: baseBody.role,
          ...(numericBranchId != null ? { branchId: numericBranchId } : {}),
        };
        const fallbackBody = {
          ...adminCreateBody,
          phoneNumber: phoneNumber.trim(),
        };
        let createdUser = null;
        let adminCreateAccepted = false;
        let recoveredExistingUser = false;
        let roleWarning = "";

        try {
          await apiRequest("/admin/security/users", "POST", adminCreateBody);
          adminCreateAccepted = true;
        } catch (createError) {
          if (![403, 500].includes(Number(createError?.status))) {
            throw createError;
          }

          if (Number(createError?.status) === 500) {
            try {
              createdUser = await getUserByEmail(baseBody.email);
              recoveredExistingUser = Boolean(createdUser?.id || createdUser?.email);
            } catch {
              // If lookup fails, try the public signup path below.
            }
          }

          if (!recoveredExistingUser) {
            try {
              createdUser = await fallbackSignUpUser(fallbackBody);
            } catch (fallbackError) {
              try {
                createdUser = await getUserByEmail(baseBody.email);
                recoveredExistingUser = Boolean(createdUser?.id || createdUser?.email);
              } catch {
                const error = new Error(
                  `Backend could not create this user. Admin create failed: ${createError.message}. Sign-up fallback failed: ${fallbackError.message}.`
                );
                error.status = fallbackError.status || createError.status;
                throw error;
              }
            }
          }
        }

        if (!adminCreateAccepted && baseBody.role !== "USER") {
          try {
            await assignBackendRole({
              email: baseBody.email,
              role: baseBody.role,
              userId: createdUser?.id,
            });
          } catch (roleError) {
            roleWarning = ` User was saved, but backend role assignment failed: ${roleError.message}`;
          }
        }

        const successMessage = recoveredExistingUser
          ? `User already exists; saved successfully: ${email}${roleWarning}`
          : `User created successfully: ${email}${roleWarning}`;
        setSuccess(successMessage);
        toast.success(successMessage);
        const savedUser = {
          id: createdUser?.id || Date.now(),
          email: baseBody.email,
          name: baseBody.name,
          username: baseBody.name,
          userName: baseBody.name,
          role: baseBody.role,
          userCode: createdUser?.userCode || userCode,
          branchId: selectedBranch?.id || HEAD_OFFICE_ID,
          branchName: getBranchLabel(selectedBranch),
          locationType: selectedBranch?.id === HEAD_OFFICE_ID ? "HEAD_OFFICE" : "BRANCH",
          firstName: createdUser?.firstName || "",
          lastName: createdUser?.lastName || "",
        };
        cacheSecurityUser(savedUser);
        setRegisteredDisplayName(savedUser.email, savedUser.name);
        upsertMessengerUser(savedUser);
        setUsers((current) => [
          savedUser,
          ...current.filter(
            (user) =>
              String(user.email).trim().toLowerCase() !==
              String(savedUser.email).trim().toLowerCase()
          ),
        ]);
        setUserCode(savedUser.userCode || "");
      }

      setPassword("");
      setVerifyPassword("");
    } catch (submitError) {
      setError(createUserErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-page create-modify-user-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Create And Modify User</h1>
            <p>
              Create a new user or load an existing account by email and update the
              role, password, and security question details in one standard form.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Current Mode</span>
            <strong>{mode === "modify" ? "Modify" : "Create"}</strong>
          </div>
        </section>

        {error ? (
          <div className="security-alert security-alert-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              Close
            </button>
          </div>
        ) : null}

        {success ? (
          <div className="security-alert security-alert-success">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}>
              Close
            </button>
          </div>
        ) : null}

        <section className="security-layout security-grid-2">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>User Account Form</h2>
                <p>Use create mode for a new user or load an existing account to modify it.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-actions" style={{ marginBottom: "16px" }}>
                <button
                  className={`security-btn ${mode === "create" ? "security-btn-primary" : "security-btn-secondary"}`}
                  type="button"
                  onClick={() => {
                    setMode("create");
                    resetForm();
                    setUserCode(buildAutoUserCode());
                  }}
                >
                  Create Mode
                </button>
                <button
                  className={`security-btn ${mode === "modify" ? "security-btn-primary" : "security-btn-secondary"}`}
                  type="button"
                  onClick={() => {
                    setMode("modify");
                    resetForm();
                  }}
                >
                  Modify Mode
                </button>
              </div>

              <div className="security-form-grid two">
                <div className="security-field">
                  <label htmlFor={mode === "modify" ? "selectedUser" : "userEmail"}>
                    {mode === "modify" ? "Load Existing User" : "Email"}
                  </label>
                  {mode === "modify" ? (
                    <select
                      id="selectedUser"
                      className="security-select"
                      value={email}
                      onChange={(event) => {
                        const nextEmail = event.target.value;
                        const nextUser = users.find((user) => user.email === nextEmail);
                        setEmail(nextEmail);
                        if (nextEmail) {
                          setLoadedUserId(nextUser?.id || null);
                          setName(nextUser?.name || nextUser?.fullName || nextUser?.username || nextUser?.userName || "");
                          setUserRole(nextUser?.role || "");
                          setUserCode(getRegisteredUserCode(nextUser));
                          handleLoadUser(nextEmail, nextUser);
                        } else {
                          resetForm();
                          setMode("modify");
                        }
                      }}
                    >
                      <option value="">Select user</option>
                      {users.map((user) => {
                        const displayName =
                          user.name ||
                          user.fullName ||
                          [user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(" ")
                            .trim();

                        return (
                          <option key={user.id} value={user.email}>
                            {displayName ? `${displayName} - ${user.email}` : user.email}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      id="userEmail"
                      className="security-input"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        const nextEmail = event.target.value;
                        setEmail(nextEmail);
                      }}
                    />
                  )}
                </div>
                <div className="security-field">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    className="security-input"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter name"
                    autoComplete="name"
                  />
                </div>
                <div className="security-field">
                  <label>Mode Action</label>
                  <div className="security-actions">
                    {mode === "modify" ? (
                      <span className="security-badge">Choose a user to auto-fill details</span>
                    ) : (
                      <span className="security-badge">User code is created automatically</span>
                    )}
                  </div>
                </div>
                {mode === "create" ? (
                  <div className="security-field">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      id="phoneNumber"
                      className="security-input"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="08012345678"
                    />
                  </div>
                ) : null}
                <div className="security-field">
                  <label htmlFor="userPassword">Password</label>
                  <input id="userPassword" className="security-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "modify" ? "Leave blank to keep current password" : ""} />
                </div>
                <div className="security-field">
                  <label htmlFor="verifyPassword">Verify Password</label>
                  <input id="verifyPassword" className="security-input" type="password" value={verifyPassword} onChange={(event) => setVerifyPassword(event.target.value)} />
                </div>
                <div className="security-field">
                  <label htmlFor="userCode">User Code</label>
                  <input
                    id="userCode"
                    className="security-input"
                    value={userCode}
                    readOnly
                  />
                </div>
                <div className="security-field">
                  <label htmlFor="userRole">Role</label>
                  <select id="userRole" className="security-select" value={userRole} onChange={(event) => setUserRole(event.target.value)}>
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="security-field">
                  <label htmlFor="userBranch">Branch / Office</label>
                  <select
                    id="userBranch"
                    className="security-select"
                    value={branchId}
                    onChange={(event) => setBranchId(event.target.value)}
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {getBranchLabel(branch)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="security-field">
                  <label htmlFor="securityQuestion">Security Question</label>
                  <select id="securityQuestion" className="security-select" value={question} onChange={(event) => setQuestion(event.target.value)}>
                    <option value="">Select question</option>
                    {questions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="security-field">
                  <label htmlFor="securityAnswer">Security Answer</label>
                  <input id="securityAnswer" className="security-input" value={answer} onChange={(event) => setAnswer(event.target.value)} />
                </div>
              </div>

              <div className="security-actions" style={{ marginTop: "16px" }}>
                <button className="security-btn security-btn-primary" type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Saving..." : mode === "modify" ? "Update User" : "Create User"}
                </button>
              </div>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h3>Account Notes</h3>
                <p>Quick reminders for user setup.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-kv">
                <div className="security-kv-item">
                  <span>Loaded User ID</span>
                  <strong>{loadedUserId || "None"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Selected User</span>
                  <strong>
                    {selectedUser
                      ? selectedUser.name ||
                        selectedUser.fullName ||
                        [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") ||
                        selectedUser.email
                      : "No user selected"}
                  </strong>
                </div>
                <div className="security-kv-item">
                  <span>Name</span>
                  <strong>{name || "Not entered"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Selected Role</span>
                  <strong>{userRole || "Not selected"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Branch / Office</span>
                  <strong>{getBranchLabel(selectedBranch)}</strong>
                </div>
                <div className="security-kv-item">
                  <span>User Code</span>
                  <strong>{userCode || "Will be generated automatically"}</strong>
                </div>
              </div>
              <div className="security-note" style={{ marginTop: "16px" }}>
                This page sends the create or update request to the backend. Password delivery by email depends on backend mail handling and was not exposed as a separate frontend-controlled endpoint in this codebase.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CreateModifyUser;
