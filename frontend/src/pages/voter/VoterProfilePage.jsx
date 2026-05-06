import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  FileBadge2,
  Mail,
  Phone,
  Save,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { voterProfileService } from "../../services/voterProfile.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";
import "../../styles/voter-clean-pages.css";

const tabs = [
  { id: "identity", label: "Identity" },
  { id: "edit", label: "Edit Profile" },
  { id: "verification", label: "Verification" },
];

const identityOptions = [
  { value: "voterId", label: "Voter ID" },
  { value: "collegeId", label: "College ID" },
  { value: "aadhaarLast4", label: "Aadhaar Last 4" },
  { value: "other", label: "Other" },
];

const ALLOWED_PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function formatDateOnly(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function formatLabel(value = "") {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getInitials(name = "Voter") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function getReadinessText(user) {
  const verificationStatus = String(
    user?.verificationStatus || "pending",
  ).toLowerCase();

  if (!user?.mobileVerified) {
    return "Your mobile number is not verified yet.";
  }

  if (!user?.ageVerified) {
    return "Your age verification is pending.";
  }

  if (!user?.isEligibleToVote) {
    return "Your account is not eligible to vote right now.";
  }

  if (verificationStatus !== "approved") {
    return "Admin approval is required before you can vote.";
  }

  return "Your account is verified and ready for voting.";
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <article className="voter-info-card vpp-info-card">
      <div className="voter-info-card__icon">
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value || "-"}</strong>
      </div>
    </article>
  );
}

export default function VoterProfilePage() {
  const { user, setUser, fetchCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState("identity");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    identityType: "other",
    identityLast4: "",
  });

  useEffect(() => {
    setFormData({
      fullName: user?.fullName || "",
      identityType: user?.identityType || "other",
      identityLast4: user?.identityLast4 || "",
    });
  }, [user?.fullName, user?.identityType, user?.identityLast4]);

  const verificationStatus = String(user?.verificationStatus || "pending");
  const verificationStatusLower = verificationStatus.toLowerCase();
  const verificationLabel = formatLabel(verificationStatus);

  const completedChecks = useMemo(() => {
    const checks = [
      Boolean(user?.mobileVerified),
      Boolean(user?.ageVerified),
      Boolean(user?.isEligibleToVote),
      verificationStatusLower === "approved",
    ];

    return checks.filter(Boolean).length;
  }, [
    user?.ageVerified,
    user?.isEligibleToVote,
    user?.mobileVerified,
    verificationStatusLower,
  ]);

  const readinessText = useMemo(() => getReadinessText(user), [user]);

  const profileInitials = getInitials(user?.fullName || "Voter");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: name === "identityLast4" ? value.slice(0, 4) : value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const payload = {
      fullName: formData.fullName.trim(),
      identityType: formData.identityType,
      identityLast4: formData.identityLast4.trim(),
    };

    try {
      setIsSaving(true);

      const data = await voterProfileService.updateMyProfile(payload);
      const updatedUser = data?.user || null;

      if (updatedUser) {
        setUser(updatedUser);
      } else {
        await fetchCurrentUser();
      }

      toast.success(
        data?.identityChanged
          ? "Profile updated. Identity changes require admin re-approval."
          : "Profile updated successfully.",
      );

      setActiveTab("identity");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      toast.error("Profile photo must be less than or equal to 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingPhoto(true);

      const data = await voterProfileService.uploadProfilePhoto(file);
      const updatedUser = data?.user || null;

      if (updatedUser) {
        setUser(updatedUser);
      } else {
        await fetchCurrentUser();
      }

      toast.success("Profile photo uploaded successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  return (
    <section className="voter-page vcp-page">
      <section className="vcp-hero vpp-hero">
        <div className="vpp-hero__profile">
          <div className="vpp-avatar">
            {user?.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt={user?.fullName || "Voter"} />
            ) : (
              <span>{profileInitials}</span>
            )}

            <label
              className="vpp-avatar__upload"
              title={isUploadingPhoto ? "Uploading..." : "Upload profile photo"}
            >
              <Camera size={16} />
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleProfilePhotoChange}
                disabled={isUploadingPhoto}
              />
            </label>
          </div>

          <div>
            <span className="vcp-eyebrow">Voter profile</span>
            <h2>{user?.fullName || "Voter"}</h2>
            <p>
              Manage your basic voter profile. Email, mobile number, and date of
              birth are locked because they are tied to authentication and
              verification.
            </p>

            <div className="vpp-chip-row">
              <span className="status-chip status-chip--green">
                {user?.role || "voter"}
              </span>

              <span
                className={
                  verificationStatusLower === "approved"
                    ? "status-chip status-chip--green"
                    : verificationStatusLower === "rejected"
                      ? "status-chip status-chip--danger"
                      : "status-chip status-chip--amber"
                }
              >
                {verificationLabel}
              </span>

              {isUploadingPhoto ? (
                <span className="status-chip status-chip--amber">
                  Uploading photo...
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="vcp-history-summary">
          <div>
            <ShieldCheck size={18} />
            <span>Checks done</span>
            <strong>{completedChecks}/4</strong>
          </div>

          <div>
            <FileBadge2 size={18} />
            <span>Voter ID</span>
            <strong>{user?.internalVoterId ? "Ready" : "Pending"}</strong>
          </div>
        </div>
      </section>

      <div className="vcp-tabs" role="tablist" aria-label="Profile tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "identity" && (
        <div className="vcp-tab-panel">
          <section className="vcp-card">
            <div className="vcp-card-header">
              <div>
                <h3>Identity Details</h3>
                <p>Basic account information linked to your voter profile.</p>
              </div>
            </div>

            <div className="vpp-info-grid">
              <InfoCard
                icon={UserCircle2}
                label="Full Name"
                value={user?.fullName}
              />
              <InfoCard icon={Mail} label="Email" value={user?.email} />
              <InfoCard
                icon={Phone}
                label="Mobile Number"
                value={user?.mobileNumber}
              />
              <InfoCard
                icon={FileBadge2}
                label="Internal Voter ID"
                value={user?.internalVoterId || "Not assigned yet"}
              />
              <InfoCard
                icon={FileBadge2}
                label="Identity Type"
                value={formatLabel(user?.identityType || "other")}
              />
              <InfoCard
                icon={FileBadge2}
                label="Identity Last 4"
                value={user?.identityLast4 || "-"}
              />
              <InfoCard
                icon={CalendarDays}
                label="Date of Birth"
                value={formatDateOnly(user?.dob)}
              />
              <InfoCard
                icon={CalendarDays}
                label="Account Created"
                value={formatDate(user?.createdAt)}
              />
            </div>
          </section>

          <section className="voter-alert voter-alert--info">
            <ShieldCheck size={18} />
            <div>
              <strong>Account readiness</strong>
              <p>{readinessText}</p>
            </div>
          </section>
        </div>
      )}

      {activeTab === "edit" && (
        <div className="vcp-tab-panel">
          <section className="vcp-card">
            <div className="vcp-card-header">
              <div>
                <h3>Edit Profile</h3>
                <p>
                  Update your name and identity details. Changing identity
                  information will require admin re-approval.
                </p>
              </div>
            </div>

            <form className="vpp-form" onSubmit={handleSaveProfile}>
              <div className="vpp-form-grid">
                <label className="vpp-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    minLength={3}
                    maxLength={80}
                    required
                  />
                </label>

                <label className="vpp-field">
                  <span>Identity Type</span>
                  <select
                    name="identityType"
                    value={formData.identityType}
                    onChange={handleChange}
                  >
                    {identityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="vpp-field">
                  <span>Identity Last 4</span>
                  <input
                    type="text"
                    name="identityLast4"
                    value={formData.identityLast4}
                    onChange={handleChange}
                    placeholder="Last 4 characters"
                    maxLength={4}
                  />
                </label>

                <label className="vpp-field vpp-field--locked">
                  <span>Email</span>
                  <input type="text" value={user?.email || ""} disabled />
                </label>

                <label className="vpp-field vpp-field--locked">
                  <span>Mobile Number</span>
                  <input
                    type="text"
                    value={user?.mobileNumber || ""}
                    disabled
                  />
                </label>

                <label className="vpp-field vpp-field--locked">
                  <span>Date of Birth</span>
                  <input
                    type="text"
                    value={formatDateOnly(user?.dob)}
                    disabled
                  />
                </label>
              </div>

              <div className="vpp-warning-box">
                <ShieldAlert size={18} />
                <div>
                  <strong>Important</strong>
                  <p>
                    If identity type or identity last 4 is changed, your voting
                    eligibility will go back to pending until admin approves it
                    again.
                  </p>
                </div>
              </div>

              <div className="vpp-form-actions">
                <button
                  type="submit"
                  className="voter-clean-button"
                  disabled={isSaving}
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>

                <label className="voter-secondary-btn vpp-upload-button">
                  <Upload size={16} />
                  {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleProfilePhotoChange}
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>
            </form>
          </section>
        </div>
      )}

      {activeTab === "verification" && (
        <div className="vcp-tab-panel">
          <section className="vcp-card">
            <div className="vcp-card-header">
              <div>
                <h3>Verification Summary</h3>
                <p>These checks decide whether backend will allow voting.</p>
              </div>
            </div>

            <div className="voter-check-list">
              <div className="voter-check-row voter-check-row--light">
                <span>Verification Status</span>
                <strong>{verificationLabel}</strong>
              </div>

              <div className="voter-check-row voter-check-row--light">
                <span>Mobile Verified</span>
                <strong>{user?.mobileVerified ? "Yes" : "No"}</strong>
              </div>

              <div className="voter-check-row voter-check-row--light">
                <span>Age Verified</span>
                <strong>{user?.ageVerified ? "Yes" : "No"}</strong>
              </div>

              <div className="voter-check-row voter-check-row--light">
                <span>Eligible To Vote</span>
                <strong>{user?.isEligibleToVote ? "Yes" : "No"}</strong>
              </div>

              <div className="voter-check-row voter-check-row--light">
                <span>Rejection Reason</span>
                <strong>{user?.verificationRejectionReason || "-"}</strong>
              </div>
            </div>
          </section>

          {verificationStatusLower === "rejected" && (
            <section className="voter-alert voter-alert--danger">
              <XCircle size={18} />
              <div>
                <strong>Verification rejected</strong>
                <p>
                  {user?.verificationRejectionReason ||
                    "No rejection reason has been provided by the administrator."}
                </p>
              </div>
            </section>
          )}

          {verificationStatusLower === "approved" && (
            <section className="voter-alert voter-alert--info">
              <CheckCircle2 size={18} />
              <div>
                <strong>Profile approved</strong>
                <p>Your profile is approved and ready for active elections.</p>
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
