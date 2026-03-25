import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";

export default function ForgotPasswordPage() {
  const [form, setForm] = useState({
    mobileNumber: "",
    otp: "",
    newPassword: "",
  });

  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    try {
      setOtpLoading(true);

      await authService.sendOtp({
        mobileNumber: form.mobileNumber,
        purpose: "reset-password",
      });

      toast.success("Reset OTP sent");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitLoading(true);

      await authService.resetPassword(form);
      toast.success("Password reset successful");
      setForm({
        mobileNumber: "",
        otp: "",
        newPassword: "",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Request OTP and set a new strong password."
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

        <InputField
          label="New Password"
          name="newPassword"
          type="password"
          placeholder="Enter new password"
          value={form.newPassword}
          onChange={handleChange}
        />

        <Button type="submit" loading={submitLoading}>
          Reset Password
        </Button>

        <p className="auth-footer-text">
          Back to <Link to={APP_ROUTES.LOGIN}>Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
