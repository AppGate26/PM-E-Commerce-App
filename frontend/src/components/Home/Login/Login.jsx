import React, { useRef, useState } from "react";
import "./Login.css";
import "./LoginQuery.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getUserModulesFromProfile } from "../../../lib/moduleAccess";

const moduleRoutes = {
  inventory: "/inventory",
  client: "/client",
  ordering_sales: "/orderTab",
  accounting: "/Accounting",
  payment: "/payment",
  care: "/care",
  recovery: "/recovery",
  delivery: "/delivery",
  cashier_stand: "/cashier",
  mail_messenger: "/messenger",
};

const Login = ({ onSuccess }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const submittingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, logout } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const checkIfAdmin = (user) => {
    if (!user) return false;

    const derivedRole =
      user.role ||
      user.userType ||
      user.user_role ||
      (Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles[0]?.name || user.roles[0]?.authority || user.roles[0]
        : "") ||
      (Array.isArray(user.authorities) && user.authorities.length > 0
        ? user.authorities[0]?.name || user.authorities[0]?.authority || user.authorities[0]
        : "");
    const userRole = derivedRole || "";
    const roleUpper = userRole.toString().toUpperCase();

    return (
      roleUpper === "SUPER_ADMIN" ||
      roleUpper === "ADMIN" ||
      user.isAdmin === true ||
      user.userType === "ADMIN" ||
      user.userType === "SUPER_ADMIN" ||
      user.userType === "admin"
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || loading) return;

    submittingRef.current = true;
    setError("");
    setHasSubmitted(true);

    if (!formValues.email || !formValues.password) {
      submittingRef.current = false;
      setError("Please provide both email and password");
      return;
    }

    try {
      logout();
      const result = await login(formValues.email, formValues.password);

      if (result && result.user) {
        const isAdminUser = checkIfAdmin(result.user);

        if (isAdminUser) {
          sessionStorage.setItem("isAdmin", "true");
          sessionStorage.setItem("adminEmail", result.user.email || formValues.email);

          if (typeof onSuccess === "function") {
            onSuccess();
          }

          navigate("/admin/dashboard", { replace: true });
          return;
        }
      }

      const assignedModules = getUserModulesFromProfile(result.user);
      const defaultModulePath = moduleRoutes[assignedModules[0]];
      const redirectPath =
        location?.state?.from?.pathname &&
        location.state.from.pathname !== "/auth/login"
          ? location.state.from.pathname
          : defaultModulePath || "/adminDashboard";

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      navigate(redirectPath, { replace: true });
    } catch (submitError) {
      setError(submitError?.message || "Unable to sign in. Please try again.");
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <div className='login-page'>
      <div className='login-layout'>
        <section className='login-brand-panel' aria-label='Peace of Mind account access'>
          <div className='login-brand-mark'>PM</div>
          <div>
            <p className='login-kicker'>Peace of Mind</p>
            <h1>Welcome Back</h1>
            <p>
              Sign in to continue to your assigned workspace and manage the tools
              connected to your role.
            </p>
          </div>
          <div className='login-feature-list'>
            <span>Secure access</span>
            <span>Role based modules</span>
            <span>Admin dashboard</span>
          </div>
        </section>

        <section className='form-box'>
          <form onSubmit={handleSubmit} noValidate>
            <h2 className='login-form-title'>Account Sign In</h2>
            <p className='login-form-subtitle'>Enter your credentials to continue.</p>

            <div className='input-box'>
              <label htmlFor='email' className='login-label'>
                Email Address
              </label>
              <div className='login-input-wrap'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='18'
                  height='18'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.8'
                  className='icon-id'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path d='M20 21a8 8 0 1 0-16 0' />
                  <circle cx='12' cy='7' r='4' />
                </svg>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formValues.email}
                  onChange={handleChange}
                  placeholder='name@company.com'
                  className='login-input'
                  autoComplete='email'
                  required
                />
              </div>
            </div>

            <div className='password-container'>
              <label htmlFor='password' className='login-label'>
                Password
              </label>
              <div className='input-box'>
                <div className='login-input-wrap'>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    id='password'
                    name='password'
                    placeholder='Enter your password'
                    value={formValues.password}
                    onChange={handleChange}
                    required
                    autoComplete='current-password'
                    className='login-input'
                  />
                  <span
                    className='password-toggle'
                    onClick={togglePasswordVisibility}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        togglePasswordVisibility();
                      }
                    }}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='18'
                      height='18'
                      fill='currentColor'
                      className={`bi ${
                        passwordVisible ? "bi-eye-slash-fill" : "bi-eye-fill"
                      }`}
                      viewBox='0 0 16 16'
                    >
                      {passwordVisible ? (
                        <>
                          <path d='M13.359 11.238 15.5 13.379A13.133 13.133 0 0 0 16 12s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l1.673 1.673A3.5 3.5 0 0 1 12 12.117z' />
                          <path d='m2.354 1.646-.708.708 12 12 .708-.708z' />
                          <path d='M7.138 9.966 9.034 11.86a2 2 0 0 1-1.896-1.896M5.56 8.39l1.283 1.283A3.5 3.5 0 0 0 12.327 15.156l1.728 1.728A8.95 8.95 0 0 1 8 19.5C3 19.5 0 14 0 14a17.456 17.456 0 0 1 5.56-5.61' />
                        </>
                      ) : (
                        <>
                          <path d='M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z' />
                          <path d='M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5' />
                        </>
                      )}
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <p className='login-error' role='alert'>
                {error}
              </p>
            )}

            {!error && hasSubmitted && (
              <p className='login-success' role='status'>
                Signing you in...
              </p>
            )}

            <button className='Log_in-btn' type='submit' disabled={loading}>
              {loading ? "Logging In..." : "Log In"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
