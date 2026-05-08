import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/auth-pages.css";

const initialForm = {
  emailOrMobile: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ForgotPasswordPage() {
  const [form, setForm] = useState(initialForm);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = () => {
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/~`]).{8,64}$/.test(
        form.newPassword,
      )
    ) {
      toast.error("Use a stronger password.");
      return false;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSendOtp = async () => {
    if (!form.emailOrMobile.trim()) {
      toast.error("Enter email or mobile number.");
      return;
    }

    try {
      setOtpLoading(true);

      await authService.sendOtp({
        emailOrMobile: form.emailOrMobile.trim(),
        purpose: "forgot-password",
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

    if (!form.emailOrMobile.trim()) {
      toast.error("Enter email or mobile number.");
      return;
    }

    if (!/^\d{4,6}$/.test(form.otp.trim())) {
      toast.error("Enter a valid OTP.");
      return;
    }

    if (!validatePassword()) return;

    try {
      setResetLoading(true);

      await authService.resetPassword({
        emailOrMobile: form.emailOrMobile.trim(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
      });

      setResetDone(true);
      toast.success("Password reset successfully.");
      setForm(initialForm);
      setOtpSent(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Verify OTP and set a new password."
      badge="Account Recovery"
    >
      <form className="auth-mini-form" onSubmit={handleSubmit}>
        <div className="auth-mini-card">
          <div className="auth-mini-card__icon">
            <KeyRound size={21} />
          </div>

          <div>
            <h3>Password recovery</h3>
            <p>Use OTP to protect your account reset.</p>
          </div>
        </div>

        {resetDone ? (
          <div className="auth-success-box">
            <CheckCircle2 size={20} />
            <div>
              <strong>Password updated</strong>
              <p>You can now login with your new password.</p>
            </div>
          </div>
        ) : null}

        <InputField
          label="Email or Mobile"
          name="emailOrMobile"
          placeholder="example@mail.com or 9876543210"
          value={form.emailOrMobile}
          onChange={handleChange}
          autoComplete="username"
        />

        <div className="auth-otp-row">
          <InputField
            label="OTP"
            name="otp"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={handleChange}
            autoComplete="one-time-code"
          />

          <Button
            type="button"
            variant="secondary"
            loading={otpLoading}
            onClick={handleSendOtp}
          >
            {otpSent ? (
              <>
                <RefreshCw size={16} />
                Resend
              </>
            ) : (
              <>
                <MailCheck size={16} />
                Send OTP
              </>
            )}
          </Button>
        </div>

        <InputField
          label="New Password"
          name="newPassword"
          type="password"
          placeholder="Create new password"
          value={form.newPassword}
          onChange={handleChange}
          autoComplete="new-password"
          hint="Use uppercase, lowercase, number, and special character."
        />

        <InputField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat new password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <Button
          className="auth-login-submit"
          type="submit"
          loading={resetLoading}
        >
          Reset Password
        </Button>

        <div className="auth-link-row auth-link-row--single">
          <Link to={APP_ROUTES.LOGIN}>
            <ArrowLeft size={15} />
            Back to login
          </Link>
        </div>

        <div className="auth-security-note">
          <ShieldCheck size={16} />
          <p>Use a password that you do not use elsewhere.</p>
        </div>
      </form>
    </AuthLayout>
  );
}
