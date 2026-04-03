import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Info, KeySquare, RefreshCcw, Smartphone } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/auth-pages.css";

const initialForm = {
  mobileNumber: "",
  otp: "",
  newPassword: "",
};

export default function ForgotPasswordPage() {
  const [form, setForm] = useState(initialForm);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOtp = async () => {
    const mobileNumber = form.mobileNumber.trim();

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setOtpLoading(true);

      await authService.sendOtp({
        mobileNumber,
        purpose: "reset-password",
      });

      setOtpSent(true);
      toast.success("OTP sent successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const mobileNumber = form.mobileNumber.trim();
    const otp = form.otp.trim();
    const newPassword = form.newPassword;

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{4,6}$/.test(otp)) {
      toast.error("Please enter a valid OTP.");
      return;
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/~`]).{8,64}$/.test(
        newPassword,
      )
    ) {
      toast.error(
        "Use at least 8 characters with uppercase, lowercase, number, and special character.",
      );
      return;
    }

    try {
      setSubmitLoading(true);

      await authService.resetPassword({
        mobileNumber,
        otp,
        newPassword,
      });

      toast.success("Password updated successfully.");
      setForm(initialForm);
      setOtpSent(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Verify your registered mobile number using OTP and set a new secure password."
      badge="Credential Recovery"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__meta-strip">
          <div className="auth-form__meta-card">
            <span>Recovery method</span>
            <strong>OTP-based verification</strong>
          </div>

          <div className="auth-form__meta-card">
            <span>Required input</span>
            <strong>Registered mobile number and new password</strong>
          </div>

          <div className="auth-form__meta-card">
            <span>Best practice</span>
            <strong>Use a strong and unique password</strong>
          </div>
        </div>

        <section className="auth-form__section">
          <div className="auth-form__section-header">
            <div className="auth-form__section-copy">
              <p className="auth-form__eyebrow">Step 1</p>
              <h3 className="auth-form__title">Send verification OTP</h3>
              <p className="auth-form__description">
                Request a password-reset OTP using the mobile number associated
                with your account.
              </p>
            </div>

            <div className="auth-form__icon">
              <Smartphone size={18} />
            </div>
          </div>

          <div className="auth-form__otp-row">
            <InputField
              label="Mobile Number"
              name="mobileNumber"
              placeholder="Enter registered mobile number"
              value={form.mobileNumber}
              onChange={handleChange}
            />

            <Button
              type="button"
              variant="secondary"
              loading={otpLoading}
              onClick={handleSendOtp}
            >
              {otpSent ? "Resend OTP" : "Send OTP"}
            </Button>
          </div>
        </section>

        <section className="auth-form__section">
          <div className="auth-form__section-header">
            <div className="auth-form__section-copy">
              <p className="auth-form__eyebrow">Step 2</p>
              <h3 className="auth-form__title">Create a new password</h3>
              <p className="auth-form__description">
                Enter the received OTP and define a strong replacement password
                for your account.
              </p>
            </div>

            <div className="auth-form__icon">
              <KeySquare size={18} />
            </div>
          </div>

          <div className="auth-form__grid">
            <InputField
              className="auth-form__full"
              label="OTP"
              name="otp"
              placeholder="Enter OTP"
              value={form.otp}
              onChange={handleChange}
            />

            <InputField
              className="auth-form__full"
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={handleChange}
              hint="Use uppercase, lowercase, number, and special character."
            />
          </div>

          <div className="auth-form__helper">
            <Info size={16} />
            <p>
              Password updates should take effect immediately. Use a password
              that is not reused across other websites or applications.
            </p>
          </div>
        </section>

        <div className="auth-form__actions">
          <Button type="submit" loading={submitLoading}>
            <RefreshCcw size={16} />
            Reset Password
          </Button>

          <p className="auth-footer-text">
            Back to sign in? <Link to={APP_ROUTES.LOGIN}>Go to login</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
