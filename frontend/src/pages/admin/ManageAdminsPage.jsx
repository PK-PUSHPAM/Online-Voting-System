import { useEffect, useMemo, useState } from "react";
import { Shield, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { adminService } from "../../services/admin.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";

const initialForm = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  dob: "",
  role: "admin",
};

const roleClassMap = {
  admin: "admin-crud__status admin-crud__status--active",
  super_admin: "admin-crud__status admin-crud__status--published",
  superadmin: "admin-crud__status admin-crud__status--published",
};

export default function ManageAdminsPage() {
  const [form, setForm] = useState(initialForm);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [search, setSearch] = useState("");

  const totalAdmins = admins.length;
  const activeAdmins = useMemo(
    () => admins.filter((item) => item?.isActive !== false).length,
    [admins],
  );
  const superAdmins = useMemo(
    () =>
      admins.filter((item) =>
        ["super_admin", "superadmin"].includes(
          String(item?.role || "").toLowerCase(),
        ),
      ).length,
    [admins],
  );

  const filteredAdmins = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return admins;

    return admins.filter((admin) => {
      return (
        String(admin?.fullName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(admin?.email || "")
          .toLowerCase()
          .includes(keyword) ||
        String(admin?.mobileNumber || "")
          .toLowerCase()
          .includes(keyword) ||
        String(admin?.role || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [admins, search]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllAdmins();
      setAdmins(
        Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [],
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.mobileNumber.trim())) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!form.password || form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    try {
      setCreateLoading(true);

      await adminService.createAdmin({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobileNumber.trim(),
        password: form.password,
        dob: form.dob,
        role: form.role,
      });

      toast.success("Admin account created successfully.");
      setForm(initialForm);
      await loadAdmins();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section className="admin-crud">
      <div className="admin-crud__hero">
        <div className="admin-crud__hero-copy">
          <span className="admin-crud__eyebrow">
            <Shield size={14} />
            Administrative access
          </span>

          <h2>
            Manage platform administrators with clear role control and account
            visibility.
          </h2>

          <p>
            Administrator accounts should remain limited, traceable, and easy to
            review. This page helps create new admin users and monitor the
            current set of active platform operators.
          </p>
        </div>

        <div className="admin-crud__hero-grid">
          <div className="admin-crud__hero-stat">
            <span>Total admins</span>
            <strong>{totalAdmins}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Active admins</span>
            <strong>{activeAdmins}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Super admins</span>
            <strong>{superAdmins}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Visible after search</span>
            <strong>{filteredAdmins.length}</strong>
          </div>
        </div>
      </div>

      <div className="admin-crud__grid">
        <div className="admin-crud__panel admin-crud__panel--sticky">
          <div className="admin-crud__panel-header">
            <div>
              <h3>Create admin account</h3>
              <p>
                Add a new administrator with the correct role and access level.
              </p>
            </div>
            <span className="admin-crud__panel-badge">
              <UserPlus size={16} />
            </span>
          </div>

          <form className="admin-crud__form" onSubmit={handleCreate}>
            <InputField
              label="Full Name"
              name="fullName"
              placeholder="Enter full name"
              value={form.fullName}
              onChange={handleChange}
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={handleChange}
            />

            <InputField
              label="Mobile Number"
              name="mobileNumber"
              placeholder="Enter 10-digit mobile number"
              value={form.mobileNumber}
              onChange={handleChange}
            />

            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
            />

            <div className="admin-crud__form-grid">
              <InputField
                label="Date of Birth"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
              />

              <div className="form-field">
                <label className="form-label">Role</label>
                <select
                  className="admin-crud__select"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <p className="admin-crud__inline-note">
              Assign elevated roles carefully. Super Admin access should remain
              tightly controlled.
            </p>

            <Button
              className="admin-crud__submit"
              type="submit"
              loading={createLoading}
            >
              Create Admin
            </Button>
          </form>
        </div>

        <div className="admin-crud__panel">
          <div className="admin-crud__toolbar">
            <div className="admin-crud__toolbar-left">
              <h3 style={{ margin: 0 }}>Admin accounts</h3>
              <span className="admin-crud__meta">
                {filteredAdmins.length} item(s)
              </span>
            </div>

            <div className="admin-crud__toolbar-right">
              <InputField
                className="admin-crud__search"
                placeholder="Search by name, email, mobile, or role"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="admin-crud__empty">
              <p>Loading admin accounts...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="admin-crud__empty">
              <p>No admin accounts match the current search.</p>
            </div>
          ) : (
            <div className="admin-crud__list">
              {filteredAdmins.map((admin) => {
                const roleKey = String(admin?.role || "").toLowerCase();

                return (
                  <article key={admin._id} className="admin-crud__card">
                    <div className="admin-crud__card-top">
                      <div className="admin-crud__title-stack">
                        <h4>{admin?.fullName || "Admin User"}</h4>
                        <p>{admin?.email || "No email available"}</p>
                      </div>

                      <span
                        className={
                          roleClassMap[roleKey] ||
                          "admin-crud__status admin-crud__status--active"
                        }
                      >
                        {admin?.role || "admin"}
                      </span>
                    </div>

                    <div className="admin-crud__chips">
                      <span className="admin-crud__chip">
                        <UserCog size={14} />
                        {admin?.mobileNumber || "No mobile number"}
                      </span>

                      <span className="admin-crud__chip">
                        <ShieldCheck size={14} />
                        {admin?.isActive !== false
                          ? "Active account"
                          : "Inactive account"}
                      </span>

                      <span className="admin-crud__chip">
                        Created:{" "}
                        {admin?.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
