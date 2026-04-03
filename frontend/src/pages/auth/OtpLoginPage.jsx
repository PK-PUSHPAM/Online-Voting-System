import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { KeyRound, ShieldCheck, Smartphone, Info } from "lucide-react";
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
};

export default function OtpLoginPage() {
  const navigate = useNavigate();

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

    const mobileNumber = form.mobileNumber.trim();
    const otp = form.otp.trim();

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{4,6}$/.test(otp)) {
      toast.error("Please enter a valid OTP.");
      return;
    }

    try {
      setSubmitLoading(true);

      const response = await authService.loginWithOtp({
        mobileNumber,
        otp,
      });

      toast.success("Signed in successfully.");

      const role = String(response?.user?.role || "").toLowerCase();

      if (role === "admin" || role === "super_admin" || role === "superadmin") {
        navigate(APP_ROUTES.ADMIN_DASHBOARD);
        return;
      }

      navigate(APP_ROUTES.VOTER_DASHBOARD);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Login with OTP"
      subtitle="Use your registered mobile number to request a one-time passcode and sign in securely."
      badge="Passwordless Sign-In"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__meta-strip">
          <div className="auth-form__meta-card">
            <span>Primary factor</span>
            <strong>Registered mobile number</strong>
          </div>

          <div className="auth-form__meta-card">
            <span>OTP validity</span>
            <strong>Short-duration one-time code</strong>
          </div>

          <div className="auth-form__meta-card">
            <span>Use case</span>
            <strong>Fast access without password</strong>
          </div>
        </div>

        <section className="auth-form__section">
          <div className="auth-form__section-header">
            <div className="auth-form__section-copy">
              <p className="auth-form__eyebrow">Step 1</p>
              <h3 className="auth-form__title">Request OTP</h3>
              <p className="auth-form__description">
                Enter the mobile number linked to your account and request a
                one-time passcode.
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
              <h3 className="auth-form__title">Verify and sign in</h3>
              <p className="auth-form__description">
                Enter the OTP exactly as received. Incorrect or expired codes
                will not be accepted.
              </p>
            </div>

            <div className="auth-form__icon">
              <KeyRound size={18} />
            </div>
          </div>

          <InputField
            label="OTP"
            name="otp"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={handleChange}
          />

          <div className="auth-form__helper">
            <Info size={16} />
            <p>
              OTP login still respects account status. If your account is
              restricted, sign-in may succeed while voting actions remain
              unavailable.
            </p>
          </div>
        </section>

        <div className="auth-form__actions">
          <Button type="submit" loading={submitLoading}>
            Verify and Sign In
          </Button>

          <p className="auth-footer-text">
            Prefer password login?{" "}
            <Link to={APP_ROUTES.LOGIN}>Sign in with password</Link>
          </p>

          <p className="auth-footer-text">
            Need a new account?{" "}
            <Link to={APP_ROUTES.REGISTER}>Create an account</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
