import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle2,
  Info,
  CalendarClock,
  UserPlus,
  Trash2,
} from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { uploadService } from "../../services/upload.service";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/register-page.css";
import "../../styles/auth-pages.css";

const initialForm = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  otp: "",
  dob: "",
  identityType: "other",
  identityLast4: "",
  documentUrl: "",
  documentPublicId: "",
};

const identityTypeOptions = [
  { value: "other", label: "Other" },
  { value: "voterId", label: "Voter ID" },
  { value: "collegeId", label: "College ID" },
  { value: "aadhaarLast4", label: "Aadhaar Last 4" },
];

const getAgeFromDob = (dob) => {
  if (!dob) return null;

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

export default function RegisterPage() {
  const { register, isAuthActionLoading } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [documentUploadLoading, setDocumentUploadLoading] = useState(false);
  const [uploadedDocumentName, setUploadedDocumentName] = useState("");

  const age = useMemo(() => getAgeFromDob(form.dob), [form.dob]);

  const isIdentityLast4Required = useMemo(
    () => form.identityType !== "other",
    [form.identityType],
  );

  const ageEligibilityText = useMemo(() => {
    if (!form.dob || age === null) {
      return {
        className: "register-age-status register-age-status--warn",
        text: "Add date of birth to check age eligibility.",
      };
    }

    if (age >= 18) {
      return {
        className: "register-age-status register-age-status--ok",
        text: `Age eligibility check passed: ${age} years`,
      };
    }

    return {
      className: "register-age-status register-age-status--warn",
      text: `Age eligibility check failed: ${age} years`,
    };
  }, [age, form.dob]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (form.fullName.trim().length < 3) {
      nextErrors.fullName = "Full name must be at least 3 characters.";
    }

    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      nextErrors.email = "A valid email address is required.";
    }

    if (!/^[6-9]\d{9}$/.test(form.mobileNumber.trim())) {
      nextErrors.mobileNumber = "Enter a valid 10-digit Indian mobile number.";
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/~`]).{8,64}$/.test(
        form.password,
      )
    ) {
      nextErrors.password =
        "Use at least 8 characters with uppercase, lowercase, number, and special character.";
    }

    if (!/^\d{4,6}$/.test(form.otp.trim())) {
      nextErrors.otp = "OTP must contain 4 to 6 digits.";
    }

    if (!form.dob) {
      nextErrors.dob = "Date of birth is required.";
    }

    if (age !== null && age < 18) {
      nextErrors.dob = "You must be at least 18 years old to register.";
    }

    if (isIdentityLast4Required && !/^\d{4}$/.test(form.identityLast4.trim())) {
      nextErrors.identityLast4 =
        "Identity last 4 must contain exactly 4 digits.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSendOtp = async () => {
    const mobileNumber = form.mobileNumber.trim();
    const email = form.email.trim();

    const nextErrors = {};

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      nextErrors.mobileNumber = "Enter a valid mobile number first.";
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Enter a valid email address first.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    try {
      setOtpLoading(true);

      await authService.sendOtp({
        mobileNumber,
        purpose: "register",
      });

      setOtpSent(true);
      toast.success("OTP sent successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePickDocument = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveUploadedDocument = () => {
    setForm((prev) => ({
      ...prev,
      documentUrl: "",
      documentPublicId: "",
    }));
    setUploadedDocumentName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDocumentChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("Only PDF, PNG, JPG, JPEG, and WEBP files are allowed.");
      event.target.value = "";
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      toast.error("File size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setDocumentUploadLoading(true);

      const uploaded = await uploadService.uploadVoterDocument(
        file,
        form.documentPublicId,
      );

      setForm((prev) => ({
        ...prev,
        documentUrl: uploaded?.fileUrl || "",
        documentPublicId: uploaded?.publicId || "",
      }));

      setUploadedDocumentName(file.name);
      toast.success("Document uploaded successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      event.target.value = "";
    } finally {
      setDocumentUploadLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobileNumber.trim(),
        password: form.password,
        otp: form.otp.trim(),
        dob: form.dob,
        identityType: form.identityType,
        identityLast4:
          form.identityType === "other" ? "" : form.identityLast4.trim(),
        documentUrl: form.documentUrl,
        documentPublicId: form.documentPublicId,
      };

      const data = await register(payload);

      toast.success(
        data?.isAdult
          ? "Registration completed successfully. Please wait for admin verification."
          : "Registration submitted, but age eligibility requirements were not met.",
      );

      setForm(initialForm);
      setErrors({});
      setOtpSent(false);
      setUploadedDocumentName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      title="Create voter account"
      subtitle="Register with verified personal details to request access to the voting platform."
      badge="OTP Verified Registration"
    >
      <form onSubmit={handleSubmit} className="register-form">
        <div className="register-meta-strip">
          <div className="register-meta-pill">
            <span>Verification</span>
            <strong>Mobile OTP required</strong>
          </div>

          <div className="register-meta-pill">
            <span>Approval workflow</span>
            <strong>Admin review after registration</strong>
          </div>

          <div className="register-meta-pill">
            <span>Document support</span>
            <strong>Optional upload available</strong>
          </div>
        </div>

        <section className="register-section">
          <div className="register-section__header">
            <div className="register-section__title-wrap">
              <p className="register-section__eyebrow">Step 1</p>
              <h3 className="register-section__title">Identity details</h3>
              <p className="register-section__description">
                Provide accurate personal information to avoid delays during
                account verification.
              </p>
            </div>

            <div className="register-section__icon">
              <UserPlus size={18} />
            </div>
          </div>

          <div className="register-grid">
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
              label="Password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              hint="Use uppercase, lowercase, number, and special character."
            />

            <InputField
              label="Date of Birth"
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              error={errors.dob}
            />

            <div className="form-field">
              <label className="form-label">Identity Type</label>
              <select
                className="register-select"
                name="identityType"
                value={form.identityType}
                onChange={handleChange}
              >
                {identityTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <InputField
              className="register-grid__full"
              label="Identity Last 4"
              name="identityLast4"
              placeholder="Enter last 4 digits"
              value={form.identityLast4}
              onChange={handleChange}
              error={errors.identityLast4}
              hint={
                isIdentityLast4Required
                  ? "Required for the selected identity type."
                  : "Optional when identity type is set to Other."
              }
            />
          </div>

          <div className={ageEligibilityText.className}>
            <CalendarClock size={16} />
            <span>{ageEligibilityText.text}</span>
          </div>
        </section>

        <section className="register-section">
          <div className="register-section__header">
            <div className="register-section__title-wrap">
              <p className="register-section__eyebrow">Step 2</p>
              <h3 className="register-section__title">Supporting document</h3>
              <p className="register-section__description">
                You may upload a document to support your verification request
                and reduce manual follow-up.
              </p>
            </div>

            <div className="register-section__icon">
              <FileText size={18} />
            </div>
          </div>

          <div className="register-upload">
            <div className="register-upload__box">
              <div className="register-upload__content">
                <div className="register-upload__icon">
                  <Upload size={18} />
                </div>

                <div>
                  <h4>Upload identity or supporting document</h4>
                  <p>
                    Accepted formats: PDF, PNG, JPG, JPEG, WEBP. Maximum size: 5
                    MB.
                  </p>
                </div>
              </div>

              <div className="register-upload__actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="register-upload__hidden-input"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleDocumentChange}
                />

                <Button
                  type="button"
                  variant="secondary"
                  loading={documentUploadLoading}
                  onClick={handlePickDocument}
                >
                  {form.documentUrl ? "Replace file" : "Choose file"}
                </Button>
              </div>
            </div>

            {form.documentUrl ? (
              <div className="register-upload__summary">
                <div className="register-upload__summary-left">
                  <div className="register-upload__summary-icon">
                    <CheckCircle2 size={18} />
                  </div>

                  <div>
                    <h5>Document uploaded</h5>
                    <p>{uploadedDocumentName || "Uploaded file attached"}</p>
                  </div>
                </div>

                <div className="register-upload__actions">
                  <a
                    href={form.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="register-upload__summary-link"
                  >
                    Open file
                  </a>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRemoveUploadedDocument}
                  >
                    <Trash2 size={16} />
                    Remove
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="register-helper">
            <Info size={16} />
            <p>
              Document upload is optional, but it can help accelerate the manual
              verification process.
            </p>
          </div>
        </section>

        <section className="register-section">
          <div className="register-section__header">
            <div className="register-section__title-wrap">
              <p className="register-section__eyebrow">Step 3</p>
              <h3 className="register-section__title">OTP verification</h3>
              <p className="register-section__description">
                Request the OTP first, then enter the code exactly as received
                to complete registration.
              </p>
            </div>

            <div className="register-section__icon">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="register-otp-row">
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
              loading={otpLoading}
              onClick={handleSendOtp}
            >
              {otpSent ? "Resend OTP" : "Send OTP"}
            </Button>
          </div>
        </section>

        <div className="register-submit-wrap">
          <Button type="submit" loading={isAuthActionLoading}>
            Complete Registration
          </Button>

          <p className="register-footer-note">
            After registration, your account may remain restricted until the
            admin verification process is completed.
          </p>

          <p className="auth-footer-text">
            Already have an account? <Link to={APP_ROUTES.LOGIN}>Sign in</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
