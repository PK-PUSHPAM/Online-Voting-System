import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";

const initialForm = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  otp: "",
  dob: "",
  identityType: "other",
  identityLast4: "",
};

export default function RegisterPage() {
  const { register, isAuthActionLoading } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const isIdentityLast4Required = useMemo(
    () => form.identityType !== "other",
    [form.identityType],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (form.fullName.trim().length < 3) {
      nextErrors.fullName = "Full name must be at least 3 characters";
    }

    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      nextErrors.email = "Valid email is required";
    }

    if (!/^[6-9]\d{9}$/.test(form.mobileNumber.trim())) {
      nextErrors.mobileNumber = "Enter a valid 10-digit Indian mobile number";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required";
    }

    if (!form.otp.trim()) {
      nextErrors.otp = "OTP is required";
    }

    if (!form.dob) {
      nextErrors.dob = "Date of birth is required";
    }

    if (
      isIdentityLast4Required &&
      form.identityLast4 &&
      !/^\d{4}$/.test(form.identityLast4.trim())
    ) {
      nextErrors.identityLast4 = "Identity last 4 must be exactly 4 digits";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber.trim())) {
      setErrors((prev) => ({
        ...prev,
        mobileNumber: "Enter a valid mobile number first",
      }));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      setErrors((prev) => ({
        ...prev,
        email: "Valid email is required before sending OTP",
      }));
      return;
    }

    try {
      setOtpLoading(true);

      await authService.sendOtp({
        mobileNumber: form.mobileNumber,
        email: form.email,
        purpose: "register",
      });

      setOtpSent(true);
      toast.success("OTP sent to mobile. Email attempt also triggered.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        mobileNumber: form.mobileNumber,
        password: form.password,
        otp: form.otp,
        dob: form.dob,
        identityType: form.identityType,
        identityLast4: form.identityLast4,
      };

      const data = await register(payload);

      toast.success(
        data?.isAdult
          ? "Registration successful. Waiting for admin verification."
          : "Registration successful, but age eligibility failed.",
      );

      setForm(initialForm);
      setOtpSent(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      title="Create voter account"
      subtitle="OTP-verified registration with basic eligibility fields."
    >
      <form onSubmit={handleSubmit} className="auth-form auth-form--grid">
        <InputField
          label="Full Name"
          name="fullName"
          placeholder="Enter full name"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
        />

        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <InputField
          label="Mobile Number"
          name="mobileNumber"
          placeholder="10-digit mobile number"
          value={form.mobileNumber}
          onChange={handleChange}
          error={errors.mobileNumber}
        />

        <InputField
          label="Date of Birth"
          name="dob"
          type="date"
          value={form.dob}
          onChange={handleChange}
          error={errors.dob}
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          placeholder="Strong password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint="At least 8 chars, uppercase, lowercase, number, special char."
        />

        <div className="form-field">
          <label className="form-label">Identity Type</label>
          <select
            className="form-input"
            name="identityType"
            value={form.identityType}
            onChange={handleChange}
          >
            <option value="other">Other</option>
            <option value="voterId">Voter ID</option>
            <option value="collegeId">College ID</option>
            <option value="aadhaarLast4">Aadhaar Last 4</option>
          </select>
        </div>

        <InputField
          label="Identity Last 4"
          name="identityLast4"
          placeholder="Last 4 digits"
          value={form.identityLast4}
          onChange={handleChange}
          error={errors.identityLast4}
        />

        <div className="otp-row">
          <InputField
            label="OTP"
            name="otp"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={handleChange}
            error={errors.otp}
          />

          <Button
            type="button"
            variant="secondary"
            className="otp-btn"
            loading={otpLoading}
            onClick={handleSendOtp}
          >
            {otpSent ? "Resend OTP" : "Send OTP"}
          </Button>
        </div>

        <Button type="submit" loading={isAuthActionLoading}>
          Register
        </Button>

        <p className="auth-footer-text">
          Already have an account? <Link to={APP_ROUTES.LOGIN}>Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
