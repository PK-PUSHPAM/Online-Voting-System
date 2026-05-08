import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
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
      toast.error("Enter your email address or mobile number.");
      return;
    }

    if (!form.password) {
      toast.error("Enter your password.");
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
      title="Welcome back"
      subtitle="Login with registered email/mobile and password."
      badge="Secure Login"
    >
      <form className="auth-form auth-form--compact" onSubmit={handleSubmit}>
        <div className="auth-login-intro">
          <div className="auth-login-intro__icon">
            <LockKeyhole size={20} />
          </div>

          <div>
            <h3>Account sign in</h3>
            <p>Same login for voter, admin, and super admin.</p>
          </div>
        </div>

        <div className="auth-demo-card">
          <div>
            <strong>Demo preview</strong>
            <span>Fake read-only dashboards</span>
          </div>

          <Link to="/demo">
            <Eye size={16} />
            Open Demo
          </Link>
        </div>

        <div className="auth-login-fields">
          <InputField
            className="auth-form__full"
            label="Email or Mobile Number"
            name="emailOrMobile"
            placeholder="example@mail.com or 9876543210"
            value={form.emailOrMobile}
            onChange={handleChange}
            autoComplete="username"
          />

          <InputField
            className="auth-form__full"
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        <div className="auth-login-options">
          <Link to={APP_ROUTES.OTP_LOGIN}>
            <Fingerprint size={15} />
            Login with OTP
          </Link>

          <Link to={APP_ROUTES.FORGOT_PASSWORD}>
            <KeyRound size={15} />
            Forgot password?
          </Link>
        </div>

        <Button
          className="auth-login-submit"
          type="submit"
          loading={isAuthActionLoading}
        >
          Sign In
          {!isAuthActionLoading ? <ArrowRight size={17} /> : null}
        </Button>

        <div className="auth-login-divider">
          <span />
          <p>New voter?</p>
          <span />
        </div>

        <Link className="auth-register-cta" to={APP_ROUTES.REGISTER}>
          <UserPlus size={17} />
          Create voter account
        </Link>

        <div className="auth-security-note">
          <ShieldCheck size={16} />
          <p>Role-based dashboard opens after login.</p>
        </div>

        <div className="auth-demo-strip">
          <div>
            <Mail size={15} />
            <span>Email/mobile login</span>
          </div>

          <div>
            <ShieldCheck size={15} />
            <span>Role redirect</span>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
