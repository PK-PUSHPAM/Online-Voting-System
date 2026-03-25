import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";

const getRedirectPathByRole = (role) => {
  if (role === "admin" || role === "super_admin") {
    return APP_ROUTES.ADMIN_DASHBOARD;
  }

  return APP_ROUTES.VOTER_DASHBOARD;
};

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const { loginWithOtp, isAuthActionLoading } = useAuth();

  const [form, setForm] = useState({
    mobileNumber: "",
    otp: "",
  });

  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    try {
      setOtpLoading(true);

      await authService.sendOtp({
        mobileNumber: form.mobileNumber,
        purpose: "login",
      });

      toast.success("Login OTP sent");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await loginWithOtp(form);
      toast.success("OTP login successful");
      navigate(getRedirectPathByRole(data?.user?.role), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      title="Login with OTP"
      subtitle="Use mobile + OTP for faster access."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <InputField
          label="Mobile Number"
          name="mobileNumber"
          placeholder="Enter mobile number"
          value={form.mobileNumber}
          onChange={handleChange}
        />

        <div className="otp-row">
          <InputField
            label="OTP"
            name="otp"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={handleChange}
          />

          <Button
            type="button"
            variant="secondary"
            className="otp-btn"
            loading={otpLoading}
            onClick={handleSendOtp}
          >
            Send OTP
          </Button>
        </div>

        <Button type="submit" loading={isAuthActionLoading}>
          Login with OTP
        </Button>

        <p className="auth-footer-text">
          Prefer password login? <Link to={APP_ROUTES.LOGIN}>Go back</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
