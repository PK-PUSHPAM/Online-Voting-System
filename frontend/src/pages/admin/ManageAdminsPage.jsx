import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Crown,
  Filter,
  LayoutGrid,
  ListChecks,
  Mail,
  PlusCircle,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { adminService } from "../../services/admin.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/admin-light-theme.css";

const PAGE_LIMIT = 10;

const initialForm = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  dob: "",
  role: "admin",
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "create", label: "Create Admin", icon: UserPlus },
  { id: "manage", label: "Manage Admins", icon: ListChecks },
];

function formatDateTime(value) {
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

function getInitials(name = "Admin") {
  const parts = String(name || "Admin")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function normalizeRole(role = "admin") {
  const value = String(role || "admin").toLowerCase();

  if (value === "superadmin") return "super_admin";
  return value;
}

function getRoleLabel(role = "admin") {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "super_admin") return "Super Admin";
  return "Admin";
}

function StatusPill({ active }) {
  return (
    <span
      className={
        active
          ? "amg-status amg-status--active"
          : "amg-status amg-status--inactive"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RolePill({ role }) {
  const normalizedRole = normalizeRole(role);

  return (
    <span
      className={
        normalizedRole === "super_admin"
          ? "amg-status amg-status--super"
          : "amg-status amg-status--admin"
      }
    >
      {getRoleLabel(normalizedRole)}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "green" }) {
  return (
    <article className={`amg-metric-card amg-metric-card--${tone}`}>
      <div className="amg-metric-card__icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper ? <p>{helper}</p> : null}
      </div>
    </article>
  );
}

function AdminCard({ admin, actionId, onActivate, onDeactivate }) {
  const normalizedRole = normalizeRole(admin?.role);
  const isSuperAdmin = normalizedRole === "super_admin";
  const isActive = admin?.isActive !== false;
  const isBusy = actionId === admin?._id;

  return (
    <article className="amg-admin-card">
      <div className="amg-admin-card__top">
        <div className="amg-admin-avatar">
          {admin?.profilePhotoUrl ? (
            <img src={admin.profilePhotoUrl} alt={admin.fullName || "Admin"} />
          ) : (
            <span>{getInitials(admin?.fullName || "Admin")}</span>
          )}
        </div>

        <div className="amg-admin-title">
          <h4>{admin?.fullName || "Admin User"}</h4>
          <p>{admin?.email || "No email available"}</p>
        </div>

        <RolePill role={admin?.role} />
      </div>

      <div className="amg-admin-meta">
        <div>
          <Mail size={15} />
          <span>Email</span>
          <strong>{admin?.email || "-"}</strong>
        </div>

        <div>
          <ShieldCheck size={15} />
          <span>Mobile</span>
          <strong>{admin?.mobileNumber || "-"}</strong>
        </div>

        <div>
          <BadgeCheck size={15} />
          <span>Status</span>
          <strong>{isActive ? "Active" : "Inactive"}</strong>
        </div>

        <div>
          <Shield size={15} />
          <span>Created</span>
          <strong>{formatDateTime(admin?.createdAt)}</strong>
        </div>
      </div>

      <div className="amg-chip-row">
        <StatusPill active={isActive} />

        <span className="amg-id-chip">
          <CheckCircle2 size={13} />
          ID: {String(admin?._id || "").slice(-6)}
        </span>

        {isSuperAdmin ? (
          <span className="amg-id-chip amg-id-chip--super">
            <Crown size={13} />
            Full access
          </span>
        ) : null}
      </div>

      {!isSuperAdmin ? (
        <div className="amg-admin-card__actions">
          {isActive ? (
            <button
              type="button"
              className="amg-danger-btn"
              onClick={() => onDeactivate(admin)}
              disabled={isBusy}
            >
              <XCircle size={15} />
              {isBusy ? "Updating..." : "Deactivate"}
            </button>
          ) : (
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => onActivate(admin)}
              disabled={isBusy}
            >
              <CheckCircle2 size={15} />
              {isBusy ? "Updating..." : "Activate"}
            </button>
          )}
        </div>
      ) : (
        <div className="amg-super-note">
          <Crown size={15} />
          Super admin account cannot be restricted from this panel.
        </div>
      )}
    </article>
  );
}

export default function ManageAdminsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState(initialForm);

  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionId, setActionId] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const totalAdmins = Number(pagination?.totalItems || admins.length || 0);

  const stats = useMemo(() => {
    return admins.reduce(
      (acc, admin) => {
        const role = normalizeRole(admin?.role);

        if (role === "super_admin") acc.superAdmins += 1;
        else acc.admins += 1;

        if (admin?.isActive !== false) acc.active += 1;
        else acc.inactive += 1;

        return acc;
      },
      {
        admins: 0,
        superAdmins: 0,
        active: 0,
        inactive: 0,
      },
    );
  }, [admins]);

  const latestAdmins = useMemo(() => admins.slice(0, 5), [admins]);

  const loadAdmins = async (pageToLoad = page) => {
    try {
      setLoadingAdmins(true);

      const data = await adminService.getAdmins({
        page: pageToLoad,
        limit: PAGE_LIMIT,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { isActive: statusFilter } : {}),
      });

      setAdmins(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
      setPage(pageToLoad);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setAdmins([]);
      setPagination(null);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    loadAdmins(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      toast.error("Full name is required.");
      return false;
    }

    if (!form.email.trim()) {
      toast.error("Email is required.");
      return false;
    }

    if (!form.mobileNumber.trim()) {
      toast.error("Mobile number is required.");
      return false;
    }

    if (!form.dob) {
      toast.error("Date of birth is required.");
      return false;
    }

    if (!form.password.trim() || form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return false;
    }

    return true;
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setCreateLoading(true);

      await adminService.createAdmin({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobileNumber: form.mobileNumber.trim(),
        password: form.password,
        dob: form.dob,
        role: form.role,
      });

      toast.success("Admin created successfully.");
      setForm(initialForm);
      setActiveTab("manage");
      await loadAdmins(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleActivate = async (admin) => {
    if (!admin?._id) return;

    try {
      setActionId(admin._id);
      await adminService.activateAdmin(admin._id);
      toast.success("Admin activated.");
      await loadAdmins(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleDeactivate = async (admin) => {
    if (!admin?._id) return;

    const shouldDeactivate = window.confirm(
      `Deactivate ${admin.fullName || "this admin"}?`,
    );

    if (!shouldDeactivate) return;

    try {
      setActionId(admin._id);
      await adminService.deactivateAdmin(admin._id);
      toast.success("Admin deactivated.");
      await loadAdmins(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await loadAdmins(1);
  };

  const handleRefresh = async () => {
    await loadAdmins(page);
    toast.success("Admins refreshed.");
  };

  const currentPage = Number(pagination?.currentPage || page || 1);
  const totalPages = Number(pagination?.totalPages || 1);

  return (
    <section className="admin-crud amg-page">
      <section className="amg-hero">
        <div>
          <span className="adm-eyebrow">
            <Shield size={15} />
            Super admin control
          </span>

          <h2>Manage administrator access with a clean security workflow.</h2>

          <div className="amg-hero-actions">
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => setActiveTab("create")}
            >
              <UserPlus size={16} />
              Create Admin
            </button>

            <button
              type="button"
              className="adm-secondary-btn"
              onClick={() => setActiveTab("manage")}
            >
              Manage List
            </button>
          </div>
        </div>

        <div className="amg-hero-mini-grid">
          <div>
            <span>Total</span>
            <strong>{loadingAdmins ? "..." : totalAdmins}</strong>
          </div>

          <div>
            <span>Active</span>
            <strong>{loadingAdmins ? "..." : stats.active}</strong>
          </div>

          <div>
            <span>Super admins</span>
            <strong>{loadingAdmins ? "..." : stats.superAdmins}</strong>
          </div>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}

        <button
          type="button"
          className="amg-refresh-tab"
          onClick={handleRefresh}
          disabled={loadingAdmins}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="amg-tab-panel">
          <div className="amg-metric-grid">
            <MetricCard
              icon={Users}
              label="Admins"
              value={stats.admins}
              helper="Standard access"
              tone="green"
            />

            <MetricCard
              icon={Crown}
              label="Super Admins"
              value={stats.superAdmins}
              helper="Full control"
              tone="purple"
            />

            <MetricCard
              icon={CheckCircle2}
              label="Active"
              value={stats.active}
              helper="Can access panel"
              tone="amber"
            />

            <MetricCard
              icon={XCircle}
              label="Inactive"
              value={stats.inactive}
              helper="Access restricted"
              tone="rose"
            />
          </div>

          <section className="amg-panel-card">
            <div className="amg-panel-header">
              <div>
                <h3>Latest admins</h3>
                <span>Quick preview from current list</span>
              </div>

              <button
                type="button"
                className="adm-secondary-btn"
                onClick={() => setActiveTab("manage")}
              >
                Open Manage
              </button>
            </div>

            {loadingAdmins ? (
              <div className="amg-empty-box">Loading admins...</div>
            ) : latestAdmins.length ? (
              <div className="amg-compact-list">
                {latestAdmins.map((admin) => (
                  <article key={admin._id} className="amg-compact-row">
                    <div className="amg-compact-avatar">
                      {admin?.profilePhotoUrl ? (
                        <img
                          src={admin.profilePhotoUrl}
                          alt={admin.fullName || "Admin"}
                        />
                      ) : (
                        <span>{getInitials(admin?.fullName || "Admin")}</span>
                      )}
                    </div>

                    <div>
                      <h4>{admin?.fullName || "Admin"}</h4>
                      <p>
                        {admin?.email || "No email"} •{" "}
                        {getRoleLabel(admin?.role)}
                      </p>
                    </div>

                    <StatusPill active={admin?.isActive !== false} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="amg-empty-box">No admins found.</div>
            )}
          </section>
        </div>
      )}

      {activeTab === "create" && (
        <div className="amg-tab-panel">
          <section className="amg-panel-card">
            <div className="amg-panel-header">
              <div>
                <h3>Create administrator</h3>
                <span>
                  Give access carefully. Admin accounts can control elections.
                </span>
              </div>

              <span className="amg-panel-badge">Secure</span>
            </div>

            <form className="amg-form" onSubmit={handleCreateAdmin}>
              <div className="amg-form-grid">
                <InputField
                  label="Full Name"
                  name="fullName"
                  placeholder="Admin full name"
                  value={form.fullName}
                  onChange={handleFormChange}
                />

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={handleFormChange}
                />

                <InputField
                  label="Mobile Number"
                  name="mobileNumber"
                  placeholder="10 digit mobile number"
                  value={form.mobileNumber}
                  onChange={handleFormChange}
                />

                <InputField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleFormChange}
                />

                <InputField
                  label="Temporary Password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleFormChange}
                />

                <div className="form-field amg-form-grid__full">
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleFormChange}
                    className="admin-crud__select"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="amg-warning-box">
                <Shield size={17} />
                <div>
                  <strong>Access warning</strong>
                  <p>
                    Super admin can manage admins and system settings. Do not
                    assign it casually.
                  </p>
                </div>
              </div>

              <div className="amg-form-actions">
                <Button
                  className="admin-crud__submit"
                  type="submit"
                  loading={createLoading}
                >
                  Create Admin
                </Button>

                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => setForm(initialForm)}
                  disabled={createLoading}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {activeTab === "manage" && (
        <div className="amg-tab-panel">
          <section className="amg-panel-card">
            <div className="amg-panel-header">
              <div>
                <h3>Manage administrators</h3>
                <span>{totalAdmins} admin account(s)</span>
              </div>
            </div>

            <form className="amg-filter-bar" onSubmit={handleSearchSubmit}>
              <label className="amg-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or mobile"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label className="amg-filter-select">
                <Filter size={16} />
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </label>

              <label className="amg-filter-select">
                <ShieldCheck size={16} />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>

              <Button type="submit" variant="secondary" loading={loadingAdmins}>
                Apply
              </Button>
            </form>

            {loadingAdmins ? (
              <div className="amg-empty-box amg-empty-box--large">
                Loading admins...
              </div>
            ) : admins.length ? (
              <div className="amg-admin-grid">
                {admins.map((admin) => (
                  <AdminCard
                    key={admin._id}
                    admin={admin}
                    actionId={actionId}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                  />
                ))}
              </div>
            ) : (
              <div className="amg-empty-box amg-empty-box--large">
                No admins found for current filters.
              </div>
            )}

            {pagination && totalPages > 1 ? (
              <div className="amg-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => loadAdmins(Math.max(currentPage - 1, 1))}
                  disabled={!pagination.hasPrevPage || loadingAdmins}
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="adm-primary-btn"
                  onClick={() =>
                    loadAdmins(Math.min(currentPage + 1, totalPages))
                  }
                  disabled={!pagination.hasNextPage || loadingAdmins}
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </section>
  );
}
