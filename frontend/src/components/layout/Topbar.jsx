import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  Ban,
  Bell,
  CheckCircle2,
  Clock3,
  LogOut,
  Menu,
  MessageCircle,
  Send,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { systemNotificationService } from "../../services/systemNotification.service";
import { publicChatService } from "../../services/publicChat.service";
import { getApiErrorMessage } from "../../lib/utils";

const SYSTEM_NOTIFICATION_LIMIT = 10;
const CHAT_MESSAGE_LIMIT = 20;

const pageMetaMap = {
  "/admin": {
    eyebrow: "Analytics overview",
    title: "Admin Dashboard",
    description:
      "Track elections, voter approvals, vote activity, and recent system operations.",
  },
  "/admin/elections": {
    eyebrow: "Election lifecycle",
    title: "Elections Management",
    description:
      "Create, publish, monitor, and control election windows from one place.",
  },
  "/admin/posts": {
    eyebrow: "Structure",
    title: "Posts Management",
    description:
      "Manage available positions under each election in a controlled workflow.",
  },
  "/admin/candidates": {
    eyebrow: "Nomination pipeline",
    title: "Candidates Management",
    description:
      "Review candidate entries, approval state, and election-wise candidate mapping.",
  },
  "/admin/voters": {
    eyebrow: "Verification desk",
    title: "Voter Approvals",
    description:
      "Approve, reject, and review verification state for registered voters.",
  },
  "/admin/results": {
    eyebrow: "Outcome intelligence",
    title: "Results Analytics",
    description:
      "Inspect election-level and post-level outcomes, winners, ties, and candidate vote share.",
  },
  "/admin/manage-admins": {
    eyebrow: "Governance",
    title: "Manage Admins",
    description:
      "Control admin accounts, role transitions, and active system operators.",
  },
  "/admin/system": {
    eyebrow: "Governance trail",
    title: "System Control",
    description:
      "Track audit logs, admin actions, activity volume, and accountability signals.",
  },
};

function getStatusLabel(value = "pending") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getInitials(name = "User") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function getNotificationClass(type) {
  if (type === "success") return "admin-center-notification--success";
  if (type === "warning") return "admin-center-notification--warning";
  if (type === "danger") return "admin-center-notification--danger";

  return "admin-center-notification--info";
}

export default function Topbar({ onOpenSidebar = () => {} }) {
  const location = useLocation();
  const { user, logout, isAuthActionLoading } = useAuth();

  const dropdownRef = useRef(null);
  const chatEndRef = useRef(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeBellTab, setActiveBellTab] = useState("system");

  const [isLoadingSystem, setIsLoadingSystem] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [systemUnreadCount, setSystemUnreadCount] = useState(0);

  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({
    isBlocked: false,
    block: null,
  });
  const [chatText, setChatText] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [moderatingMessageId, setModeratingMessageId] = useState("");
  const [blockingUserId, setBlockingUserId] = useState("");

  const meta = useMemo(() => {
    return (
      pageMetaMap[location.pathname] || {
        eyebrow: "Admin panel",
        title: "Control Panel",
        description: "Manage the online voting system from a centralized UI.",
      }
    );
  }, [location.pathname]);

  const role = String(user?.role || "").toLowerCase();
  const isSuperAdmin = role === "super_admin" || role === "superadmin";
  const isAdminRole = role === "admin" || isSuperAdmin;
  const isActive = user?.isActive !== false;

  const initials = useMemo(() => {
    return getInitials(user?.fullName || "User");
  }, [user?.fullName]);

  const orderedChatMessages = useMemo(() => {
    return [...chatMessages].sort((first, second) => {
      return (
        new Date(first?.createdAt || 0).getTime() -
        new Date(second?.createdAt || 0).getTime()
      );
    });
  }, [chatMessages]);

  const loadSystemNotifications = async () => {
    try {
      setIsLoadingSystem(true);

      const data = await systemNotificationService.getMyNotifications({
        page: 1,
        limit: SYSTEM_NOTIFICATION_LIMIT,
      });

      setSystemNotifications(Array.isArray(data?.items) ? data.items : []);
      setSystemUnreadCount(Number(data?.unreadCount || 0));
    } catch {
      setSystemNotifications([]);
      setSystemUnreadCount(0);
    } finally {
      setIsLoadingSystem(false);
    }
  };

  const loadPublicChat = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setIsLoadingChat(true);
      }

      const [statusData, messagesData] = await Promise.all([
        publicChatService.getMyStatus(),
        publicChatService.getMessages({
          page: 1,
          limit: CHAT_MESSAGE_LIMIT,
          includeDeleted: false,
        }),
      ]);

      setChatStatus({
        isBlocked: Boolean(statusData?.isBlocked),
        block: statusData?.block || null,
      });

      setChatMessages(
        Array.isArray(messagesData?.items) ? messagesData.items : [],
      );
    } catch (error) {
      if (!silent) {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      if (!silent) {
        setIsLoadingChat(false);
      }
    }
  };

  useEffect(() => {
    loadSystemNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.role, user?.isActive]);

  useEffect(() => {
    if (!isDropdownOpen || activeBellTab !== "chat") return undefined;

    loadPublicChat();

    const intervalId = window.setInterval(() => {
      loadPublicChat({ silent: true });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen, activeBellTab]);

  useEffect(() => {
    if (!isDropdownOpen || activeBellTab !== "chat") return;

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isDropdownOpen, activeBellTab, orderedChatMessages.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = async () => {
    const nextState = !isDropdownOpen;

    setIsDropdownOpen(nextState);

    if (nextState) {
      await loadSystemNotifications();

      if (activeBellTab === "chat") {
        await loadPublicChat();
      }
    }
  };

  const handleBellTabChange = async (tab) => {
    setActiveBellTab(tab);

    if (tab === "system") {
      await loadSystemNotifications();
    }

    if (tab === "chat") {
      await loadPublicChat();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await systemNotificationService.markAllAsRead();
      await loadSystemNotifications();
      toast.success("All system notifications marked as read.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleReadNotification = async (notification) => {
    if (!notification?._id) return;

    try {
      if (!notification.isRead) {
        await systemNotificationService.markAsRead(notification._id);
        await loadSystemNotifications();
      }

      setIsDropdownOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleSendChat = async (event) => {
    event.preventDefault();

    const message = chatText.trim();

    if (!message) return;

    if (chatStatus.isBlocked) {
      toast.error("You are blocked from public chat.");
      return;
    }

    try {
      setIsSendingChat(true);

      await publicChatService.sendMessage(message);

      setChatText("");
      await loadPublicChat({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;

    const shouldDelete = window.confirm(
      "Delete this public chat message? This action will hide it from everyone.",
    );

    if (!shouldDelete) return;

    try {
      setModeratingMessageId(messageId);

      await publicChatService.deleteMessage(
        messageId,
        "Removed by administrator from public chat.",
      );

      toast.success("Message deleted.");
      await loadPublicChat({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setModeratingMessageId("");
    }
  };

  const handleBlockUser = async (targetUser) => {
    if (!targetUser?._id) return;

    if (String(targetUser._id) === String(user?._id)) {
      toast.error("You cannot block yourself.");
      return;
    }

    const reason = window.prompt(
      `Reason for blocking ${targetUser.fullName || "this user"} from public chat:`,
      "Misuse of public chat",
    );

    if (reason === null) return;

    try {
      setBlockingUserId(targetUser._id);

      await publicChatService.blockUser(
        targetUser._id,
        reason.trim() || "Blocked by administrator",
      );

      toast.success("User blocked from public chat.");
      await loadPublicChat({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBlockingUserId("");
    }
  };

  return (
    <header
      className="admin-topbar"
      style={{
        background:
          "linear-gradient(135deg, rgba(24, 24, 44, 0.88), rgba(17, 24, 39, 0.82))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(15, 23, 42, 0.24)",
      }}
    >
      <div className="admin-topbar__left">
        <button
          type="button"
          className="admin-topbar__menu-btn"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          style={{
            background:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.14))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Menu size={20} />
        </button>

        <div className="admin-topbar__title-wrap">
          <span className="admin-topbar__eyebrow" style={{ color: "#f472b6" }}>
            {meta.eyebrow}
          </span>

          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
      </div>

      <div className="admin-topbar__right">
        <div className="admin-center-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="admin-topbar__ghost-btn admin-center-button"
            aria-label="Notifications and public chat"
            title="Notifications and public chat"
            onClick={handleToggleDropdown}
            style={{
              background:
                "linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(139, 92, 246, 0.12))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Bell size={18} />

            {systemUnreadCount > 0 ? (
              <span className="admin-center-button__badge">
                {systemUnreadCount > 9 ? "9+" : systemUnreadCount}
              </span>
            ) : null}
          </button>

          {isDropdownOpen && (
            <div className="admin-center-dropdown">
              <div className="admin-center-dropdown__header">
                <div>
                  <strong>Admin Center</strong>
                  <span>
                    {systemUnreadCount} unread system notification
                    {systemUnreadCount === 1 ? "" : "s"}
                  </span>
                </div>

                {activeBellTab === "system" ? (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={!systemNotifications.length}
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>

              <div className="admin-center-tabs" role="tablist">
                <button
                  type="button"
                  className={activeBellTab === "system" ? "is-active" : ""}
                  onClick={() => handleBellTabChange("system")}
                >
                  <Bell size={14} />
                  System
                  {systemUnreadCount > 0 ? (
                    <span>
                      {systemUnreadCount > 9 ? "9+" : systemUnreadCount}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  className={activeBellTab === "chat" ? "is-active" : ""}
                  onClick={() => handleBellTabChange("chat")}
                >
                  <MessageCircle size={14} />
                  Public Chat
                </button>
              </div>

              {activeBellTab === "system" && (
                <div className="admin-center-dropdown__body">
                  {isLoadingSystem ? (
                    <div className="admin-center-empty">
                      Loading system notifications...
                    </div>
                  ) : systemNotifications.length ? (
                    systemNotifications.map((notification) => {
                      const content = (
                        <article
                          className={[
                            "admin-center-notification",
                            getNotificationClass(notification.type),
                            !notification.isRead
                              ? "admin-center-notification--unread"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <div className="admin-center-notification__dot" />

                          <div>
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>

                            <div className="admin-center-notification__meta">
                              <span>
                                <Clock3 size={12} />
                                {formatDateTime(notification.createdAt)}
                              </span>

                              {!notification.isRead ? (
                                <strong>Unread</strong>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );

                      if (notification.link) {
                        return (
                          <Link
                            key={notification._id}
                            to={notification.link}
                            onClick={() => handleReadNotification(notification)}
                          >
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={notification._id}
                          type="button"
                          className="admin-center-plain-button"
                          onClick={() => handleReadNotification(notification)}
                        >
                          {content}
                        </button>
                      );
                    })
                  ) : (
                    <div className="admin-center-empty">
                      No system notifications right now.
                    </div>
                  )}
                </div>
              )}

              {activeBellTab === "chat" && (
                <div className="admin-chat-panel">
                  <div className="admin-chat-panel__body">
                    {isLoadingChat ? (
                      <div className="admin-center-empty">
                        Loading public chat...
                      </div>
                    ) : orderedChatMessages.length ? (
                      orderedChatMessages.map((message) => {
                        const sender = message?.senderId || {};
                        const isMine =
                          String(sender?._id) === String(user?._id);
                        const senderInitials = getInitials(
                          sender?.fullName || "User",
                        );

                        return (
                          <article
                            key={message._id}
                            className={
                              isMine
                                ? "admin-chat-message admin-chat-message--mine"
                                : "admin-chat-message"
                            }
                          >
                            <div className="admin-chat-message__avatar">
                              {sender?.profilePhotoUrl ? (
                                <img
                                  src={sender.profilePhotoUrl}
                                  alt={sender?.fullName || "User"}
                                />
                              ) : (
                                <span>{senderInitials}</span>
                              )}
                            </div>

                            <div className="admin-chat-message__content">
                              <div className="admin-chat-message__bubble">
                                <div className="admin-chat-message__top">
                                  <strong>{sender?.fullName || "User"}</strong>
                                  <span>
                                    {formatDateTime(message.createdAt)}
                                  </span>
                                </div>

                                <p>{message.message}</p>
                              </div>

                              {isAdminRole ? (
                                <div className="admin-chat-message__actions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteMessage(message._id)
                                    }
                                    disabled={
                                      moderatingMessageId === message._id
                                    }
                                  >
                                    <Trash2 size={12} />
                                    Delete
                                  </button>

                                  {!isMine ? (
                                    <button
                                      type="button"
                                      onClick={() => handleBlockUser(sender)}
                                      disabled={blockingUserId === sender?._id}
                                    >
                                      <Ban size={12} />
                                      Block user
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="admin-center-empty">
                        No public chat messages yet.
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {chatStatus.isBlocked ? (
                    <div className="admin-chat-blocked-box">
                      <strong>You are blocked from public chat.</strong>
                      <p>
                        {chatStatus?.block?.reason ||
                          "Your ability to send messages is disabled."}
                      </p>
                    </div>
                  ) : (
                    <form className="admin-chat-form" onSubmit={handleSendChat}>
                      <input
                        type="text"
                        value={chatText}
                        onChange={(event) => setChatText(event.target.value)}
                        placeholder="Type a public message..."
                        maxLength={1000}
                      />

                      <button
                        type="submit"
                        disabled={isSendingChat || !chatText.trim()}
                      >
                        <Send size={15} />
                        {isSendingChat ? "Sending" : "Send"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="admin-center-dropdown__footer">
                {activeBellTab === "system" ? (
                  <span>
                    Bell badge shows only unread system notifications.
                  </span>
                ) : (
                  <span>Admins can delete messages and block chat users.</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="admin-topbar__profile"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="admin-topbar__avatar"
            style={{
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 55%, #f472b6 100%)",
              boxShadow: "0 14px 28px rgba(139, 92, 246, 0.24)",
            }}
          >
            {initials}
          </div>

          <div className="admin-topbar__profile-text">
            <strong>{user?.fullName || "Admin User"}</strong>
            <span>
              {isSuperAdmin ? (
                <>
                  <ShieldCheck size={14} />
                  Super Admin
                </>
              ) : (
                <>
                  <UserCog size={14} />
                  Admin
                </>
              )}
            </span>
          </div>
        </div>

        <div
          className="admin-topbar__profile"
          style={{
            background: isActive
              ? "linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(6, 182, 212, 0.08))"
              : "linear-gradient(135deg, rgba(251, 113, 133, 0.12), rgba(244, 114, 182, 0.08))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="admin-topbar__avatar"
            style={{
              background: isActive
                ? "linear-gradient(135deg, #34d399, #06b6d4)"
                : "linear-gradient(135deg, #fb7185, #f472b6)",
              boxShadow: isActive
                ? "0 14px 28px rgba(52, 211, 153, 0.22)"
                : "0 14px 28px rgba(244, 114, 182, 0.22)",
            }}
          >
            {isActive ? <BadgeCheck size={16} /> : <Activity size={16} />}
          </div>

          <div className="admin-topbar__profile-text">
            <strong>{isActive ? "Account Active" : "Account Limited"}</strong>
            <span>{user?.email || "No email available"}</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-topbar__logout-btn"
          onClick={logout}
          disabled={isAuthActionLoading}
          style={{
            background:
              "linear-gradient(135deg, #8b5cf6 0%, #f472b6 52%, #f59e0b 100%)",
            boxShadow: "0 18px 34px rgba(244, 114, 182, 0.24)",
          }}
        >
          <LogOut size={16} />
          {isAuthActionLoading ? "Signing out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
