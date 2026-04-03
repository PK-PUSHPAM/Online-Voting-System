import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { LockKeyhole, ShieldCheck, UserCircle2, Info } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/auth-pages.css";

const initialForm = {
  emailOrMobile: "",
  password: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthActionLoading } = useAuth();

  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.emailOrMobile.trim()) {
      toast.error("Please enter your email address or mobile number.");
      return;
    }

    if (!form.password) {
      toast.error("Please enter your password.");
      return;
    }

    try {
      const data = await login({
        emailOrMobile: form.emailOrMobile.trim(),
        password: form.password,
      });

      toast.success("Signed in successfully.");

      const role = String(data?.user?.role || "").toLowerCase();

      if (role === "admin" || role === "super_admin" || role === "superadmin") {
        navigate(APP_ROUTES.ADMIN_DASHBOARD);
        return;
      }

      navigate(APP_ROUTES.VOTER_DASHBOARD);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Access the voting platform securely using your registered credentials."
      badge="Secure Account Access"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__meta-strip">
          <div className="auth-form__meta-card">
            <span>Login method</span>
            <strong>Email or mobile with password</strong>
          </div>

          <div className="auth-form__meta-card">
            <span>Access type</span>
            <strong>Voter, Admin, and Super Admin accounts</strong>
          </div>

          <div className="auth-form__meta-card">
            <span>Security</span>
            <strong>Session-based protected access</strong>
          </div>
        </div>

        <section className="auth-form__section">
          <div className="auth-form__section-header">
            <div className="auth-form__section-copy">
              <p className="auth-form__eyebrow">Step 1</p>
              <h3 className="auth-form__title">Account credentials</h3>
              <p className="auth-form__description">
                Enter the same email address or mobile number used during
                registration, along with your password.
              </p>
            </div>

            <div className="auth-form__icon">
              <UserCircle2 size={18} />
            </div>
          </div>

          <div className="auth-form__grid">
            <InputField
              className="auth-form__full"
              label="Email or Mobile Number"
              name="emailOrMobile"
              placeholder="Enter email or mobile number"
              value={form.emailOrMobile}
              onChange={handleChange}
            />

            <InputField
              className="auth-form__full"
              label="Password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="auth-form__section">
          <div className="auth-form__section-header">
            <div className="auth-form__section-copy">
              <p className="auth-form__eyebrow">Step 2</p>
              <h3 className="auth-form__title">Session access</h3>
              <p className="auth-form__description">
                After successful sign-in, you will be redirected according to
                your role and account permissions.
              </p>
            </div>

            <div className="auth-form__icon">
              <LockKeyhole size={18} />
            </div>
          </div>

          <div className="auth-form__helper">
            <Info size={16} />
            <p>
              If your voter account has not been approved yet, you may still
              sign in, but voting-related actions can remain restricted until
              verification is complete.
            </p>
          </div>
        </section>

        <div className="auth-form__actions">
          <Button type="submit" loading={isAuthActionLoading}>
            Sign In
          </Button>

          <p className="auth-form__footer-note">
            For passwordless access, you can use the OTP sign-in option if it is
            enabled for your account.
          </p>

          <p className="auth-footer-text">
            Need another option?{" "}
            <Link to={APP_ROUTES.OTP_LOGIN}>Login with OTP</Link>
          </p>

          <p className="auth-footer-text">
            Forgot your password?{" "}
            <Link to={APP_ROUTES.FORGOT_PASSWORD}>Reset password</Link>
          </p>

          <p className="auth-footer-text">
            New here? <Link to={APP_ROUTES.REGISTER}>Create an account</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
