import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Shield,
  ShieldCheck,
  UserCog,
  Search,
  RefreshCw,
  UserPlus,
  Lock,
  Phone,
  Mail,
  CalendarDays,
  Power,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { adminService } from "../../services/admin.service";
import { getApiErrorMessage, formatRoleLabel } from "../../lib/utils";
import "../../styles/manage-admins.css";

const initialFormState = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  dob: "",
  role: "admin",
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "primary" }) {
  return (
    <article className={`manage-admins-stat manage-admins-stat--${tone}`}>
      <div className="manage-admins-stat__top">
        <div>
          <p className="manage-admins-stat__label">{title}</p>
          <h3 className="manage-admins-stat__value">{value}</h3>
        </div>

        <div className="manage-admins-stat__icon">
          <Icon size={18} />
        </div>
      </div>

      <p className="manage-admins-stat__subtitle">{subtitle}</p>
    </article>
  );
}

function Panel({ title, description, action = null, children }) {
  return (
    <section className="manage-admins-panel">
      <div className="manage-admins-panel__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>

        {action ? <div>{action}</div> : null}
      </div>

      <div className="manage-admins-panel__body">{children}</div>
    </section>
  );
}

function EmptyState({ label }) {
  return (
    <div className="manage-admins-empty">
      <p>{label}</p>
    </div>
  );
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [rowActionKey, setRowActionKey] = useState("");

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [formValues, setFormValues] = useState(initialFormState);

  const loadAdmins = async ({ silent = false, targetPage = page } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await adminService.getAllAdmins({
        page: targetPage,
        limit: 10,
        ...(appliedSearch ? { search: appliedSearch } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { isActive: statusFilter } : {}),
      });

      setAdmins(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setAdmins([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdmins({ targetPage: page });
  }, [page, appliedSearch, roleFilter, statusFilter]);

  const totalAdmins = useMemo(
    () => Number(pagination?.totalItems || admins.length || 0),
    [pagination, admins.length],
  );

  const activeCount = useMemo(
    () => admins.filter((item) => item?.isActive).length,
    [admins],
  );

  const superAdminCount = useMemo(
    () =>
      admins.filter(
        (item) => String(item?.role || "").toLowerCase() === "super_admin",
      ).length,
    [admins],
  );

  const inactiveCount = useMemo(
    () => admins.filter((item) => !item?.isActive).length,
    [admins],
  );

  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
  const currentPage = Math.max(1, Number(pagination?.currentPage || page));

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleCreateInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetCreateForm = () => {
    setFormValues(initialFormState);
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    try {
      setSubmittingCreate(true);

      await adminService.createAdmin({
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        mobileNumber: formValues.mobileNumber.trim(),
        password: formValues.password,
        dob: formValues.dob,
        role: formValues.role,
      });

      toast.success(
        formValues.role === "super_admin"
          ? "Super admin created successfully"
          : "Admin created successfully",
      );

      resetCreateForm();
      setPage(1);
      await loadAdmins({ targetPage: 1, silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const actionKey = `${admin._id}-status`;

    try {
      setRowActionKey(actionKey);

      await adminService.updateAdminStatus(admin._id, {
        isActive: !admin.isActive,
      });

      toast.success(
        admin.isActive
          ? "Admin deactivated successfully"
          : "Admin activated successfully",
      );

      await loadAdmins({ silent: true, targetPage: currentPage });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRowActionKey("");
    }
  };

  const handleRoleChange = async (admin, nextRole) => {
    const actionKey = `${admin._id}-role`;

    try {
      setRowActionKey(actionKey);

      await adminService.changeAdminRole(admin._id, {
        role: nextRole,
      });

      toast.success(`Role changed to ${formatRoleLabel(nextRole)}`);
      await loadAdmins({ silent: true, targetPage: currentPage });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRowActionKey("");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <section className="manage-admins-page">
      <div className="manage-admins-hero">
        <div className="manage-admins-hero__content">
          <span className="manage-admins-hero__badge">
            <ShieldCheck size={15} />
            Super admin governance only
          </span>

          <h2>Admin control must be strict, readable, and hard to misuse.</h2>

          <p>
            This page handles admin creation, status control, and role changes.
            If this UI is sloppy, the whole system governance becomes sloppy.
          </p>

          <div className="manage-admins-hero__chips">
            <span>
              <UserCog size={14} />
              Access control matters
            </span>
            <span>
              <Shield size={14} />
              Don’t treat admin management like a random CRUD table
            </span>
          </div>
        </div>

        <div className="manage-admins-hero__side">
          <div className="manage-admins-hero-card">
            <span>Current page scope</span>
            <strong>Super Admin Management</strong>
            <p>
              Create admins, promote trusted operators, and disable risky
              accounts without leaving the control panel.
            </p>
          </div>
        </div>
      </div>

      <div className="manage-admins-stats">
        <StatCard
          title="Loaded Admins"
          value={formatNumber(totalAdmins)}
          subtitle="Total admins matching current filters"
          icon={UserCog}
          tone="primary"
        />

        <StatCard
          title="Active"
          value={formatNumber(activeCount)}
          subtitle="Admins currently allowed to operate"
          icon={ShieldCheck}
          tone="green"
        />

        <StatCard
          title="Super Admins"
          value={formatNumber(superAdminCount)}
          subtitle="Highest privilege operators in current list"
          icon={Shield}
          tone="cyan"
        />

        <StatCard
          title="Inactive"
          value={formatNumber(inactiveCount)}
          subtitle="Accounts disabled from system control"
          icon={Power}
          tone="amber"
        />
      </div>

      <div className="manage-admins-grid">
        <Panel
          title="Create Admin"
          description="Create admin or super admin accounts from one controlled form. Password rules are enforced by backend."
        >
          <form className="manage-admins-form" onSubmit={handleCreateAdmin}>
            <div className="manage-admins-form__grid">
              <label className="manage-admins-field">
                <span>Full Name</span>
                <input
                  type="text"
                  name="fullName"
                  value={formValues.fullName}
                  onChange={handleCreateInputChange}
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label className="manage-admins-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleCreateInputChange}
                  placeholder="Enter email address"
                  required
                />
              </label>

              <label className="manage-admins-field">
                <span>Mobile Number</span>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formValues.mobileNumber}
                  onChange={handleCreateInputChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </label>

              <label className="manage-admins-field">
                <span>Date of Birth</span>
                <input
                  type="date"
                  name="dob"
                  value={formValues.dob}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label className="manage-admins-field manage-admins-field--full">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={formValues.password}
                  onChange={handleCreateInputChange}
                  placeholder="At least 8 chars with upper, lower, number, special"
                  required
                />
              </label>

              <label className="manage-admins-field">
                <span>Role</span>
                <select
                  name="role"
                  value={formValues.role}
                  onChange={handleCreateInputChange}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </label>
            </div>

            <div className="manage-admins-form__actions">
              <button
                type="button"
                className="manage-admins-btn manage-admins-btn--ghost"
                onClick={resetCreateForm}
                disabled={submittingCreate}
              >
                Reset
              </button>

              <button
                type="submit"
                className="manage-admins-btn manage-admins-btn--primary"
                disabled={submittingCreate}
              >
                <UserPlus size={16} />
                {submittingCreate ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </form>
        </Panel>

        <Panel
          title="Filter & Review"
          description="Search by name, email, mobile, or internal ID. Then filter by role and active state."
          action={
            <button
              type="button"
              className="manage-admins-btn manage-admins-btn--soft"
              onClick={() =>
                loadAdmins({ silent: true, targetPage: currentPage })
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "spin-animation" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          <form className="manage-admins-filters" onSubmit={handleSearchSubmit}>
            <div className="manage-admins-search">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, mobile, internal ID"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(event.target.value);
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              type="submit"
              className="manage-admins-btn manage-admins-btn--secondary"
            >
              Search
            </button>

            <button
              type="button"
              className="manage-admins-btn manage-admins-btn--ghost"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </form>

          {loading ? (
            <div className="manage-admins-loading-grid">
              <div className="manage-admins-skeleton manage-admins-skeleton--row" />
              <div className="manage-admins-skeleton manage-admins-skeleton--row" />
              <div className="manage-admins-skeleton manage-admins-skeleton--row" />
            </div>
          ) : admins.length === 0 ? (
            <EmptyState label="No admins found for current filters." />
          ) : (
            <>
              <div className="manage-admins-table-wrap">
                <div className="manage-admins-table">
                  <div className="manage-admins-table__head">
                    <span>Admin</span>
                    <span>Contact</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Created</span>
                    <span>Actions</span>
                  </div>

                  <div className="manage-admins-table__body">
                    {admins.map((admin) => {
                      const roleActionBusy =
                        rowActionKey === `${admin._id}-role`;
                      const statusActionBusy =
                        rowActionKey === `${admin._id}-status`;

                      const nextRole =
                        String(admin?.role || "").toLowerCase() ===
                        "super_admin"
                          ? "admin"
                          : "super_admin";

                      return (
                        <article key={admin._id} className="manage-admins-row">
                          <div className="manage-admins-admin-cell">
                            <div className="manage-admins-avatar">
                              {String(admin?.fullName || "A")
                                .trim()
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>

                            <div className="manage-admins-admin-meta">
                              <strong>{admin?.fullName || "Unknown"}</strong>
                              <span>ID: {admin?.internalVoterId || "-"}</span>
                            </div>
                          </div>

                          <div className="manage-admins-contact-cell">
                            <span>
                              <Mail size={14} />
                              {admin?.email || "-"}
                            </span>
                            <span>
                              <Phone size={14} />
                              {admin?.mobileNumber || "-"}
                            </span>
                          </div>

                          <div>
                            <span
                              className={`manage-admins-role-pill manage-admins-role-pill--${String(
                                admin?.role || "admin",
                              ).toLowerCase()}`}
                            >
                              {formatRoleLabel(admin?.role || "admin")}
                            </span>
                          </div>

                          <div>
                            <span
                              className={`manage-admins-status-pill ${
                                admin?.isActive
                                  ? "manage-admins-status-pill--active"
                                  : "manage-admins-status-pill--inactive"
                              }`}
                            >
                              {admin?.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="manage-admins-date-cell">
                            <span>
                              <CalendarDays size={14} />
                              {formatDate(admin?.createdAt)}
                            </span>
                          </div>

                          <div className="manage-admins-actions">
                            <button
                              type="button"
                              className="manage-admins-btn manage-admins-btn--soft"
                              onClick={() => handleRoleChange(admin, nextRole)}
                              disabled={roleActionBusy || statusActionBusy}
                            >
                              <Lock size={14} />
                              {roleActionBusy
                                ? "Updating..."
                                : nextRole === "super_admin"
                                  ? "Promote"
                                  : "Demote"}
                            </button>

                            <button
                              type="button"
                              className={`manage-admins-btn ${
                                admin?.isActive
                                  ? "manage-admins-btn--danger"
                                  : "manage-admins-btn--success"
                              }`}
                              onClick={() => handleToggleStatus(admin)}
                              disabled={roleActionBusy || statusActionBusy}
                            >
                              <Power size={14} />
                              {statusActionBusy
                                ? "Updating..."
                                : admin?.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="manage-admins-pagination">
                <div className="manage-admins-pagination__info">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <strong>{formatNumber(totalAdmins)} total records</strong>
                </div>

                <div className="manage-admins-pagination__actions">
                  <button
                    type="button"
                    className="manage-admins-btn manage-admins-btn--ghost"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ArrowLeft size={14} />
                    Previous
                  </button>

                  <button
                    type="button"
                    className="manage-admins-btn manage-admins-btn--ghost"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </section>
  );
}
