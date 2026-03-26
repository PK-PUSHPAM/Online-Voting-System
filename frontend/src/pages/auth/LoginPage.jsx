import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";

const getRedirectPathByRole = (role) => {
  if (!role) return APP_ROUTES.VOTER_DASHBOARD;

  const normalizedRole = String(role).toLowerCase();

  if (
    normalizedRole === "admin" ||
    normalizedRole === "super_admin" ||
    normalizedRole === "superadmin"
  ) {
    return APP_ROUTES.ADMIN_DASHBOARD;
  }

  return APP_ROUTES.VOTER_DASHBOARD;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthActionLoading } = useAuth();

  const [form, setForm] = useState({
    emailOrMobile: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.emailOrMobile.trim()) {
      nextErrors.emailOrMobile = "Email or mobile is required";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      const data = await login(form);

      console.log("LOGIN USER:", data?.user);

      toast.success("Login successful");

      const fallbackPath = getRedirectPathByRole(data?.user?.role);
      const redirectTo = location.state?.from || fallbackPath;

      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login with your password to continue into the voting platform."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <InputField
          label="Email or Mobile Number"
          name="emailOrMobile"
          placeholder="Enter email or 10-digit mobile number"
          value={form.emailOrMobile}
          onChange={handleChange}
          error={errors.emailOrMobile}
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button type="submit" loading={isAuthActionLoading}>
          Login
        </Button>

        <div className="auth-links">
          <Link to={APP_ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
          <Link to={APP_ROUTES.OTP_LOGIN}>Login with OTP</Link>
        </div>

        <p className="auth-footer-text">
          New here? <Link to={APP_ROUTES.REGISTER}>Create voter account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
