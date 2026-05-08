import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/auth-pages.css";

const initialForm = {
  emailOrMobile: "",
  otp: "",
};

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const { verifyOtpLogin, isAuthActionLoading } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        purpose: "login",
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

    try {
      const data = await verifyOtpLogin({
        emailOrMobile: form.emailOrMobile.trim(),
        otp: form.otp.trim(),
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
      title="OTP login"
      subtitle="Enter your registered email/mobile and verify OTP."
      badge="Quick Access"
    >
      <form className="auth-mini-form" onSubmit={handleSubmit}>
        <div className="auth-mini-card">
          <div className="auth-mini-card__icon">
            <Fingerprint size={21} />
          </div>

          <div>
            <h3>Login without password</h3>
            <p>Use OTP for quick account access.</p>
          </div>
        </div>

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

        <Button
          className="auth-login-submit"
          type="submit"
          loading={isAuthActionLoading}
        >
          Verify & Login
          {!isAuthActionLoading ? <ArrowRight size={17} /> : null}
        </Button>

        <div className="auth-link-row">
          <Link to={APP_ROUTES.LOGIN}>
            <ArrowLeft size={15} />
            Password login
          </Link>

          <Link to={APP_ROUTES.REGISTER}>Create account</Link>
        </div>

        <div className="auth-security-note">
          <ShieldCheck size={16} />
          <p>Dashboard opens based on your role.</p>
        </div>
      </form>
    </AuthLayout>
  );
}
