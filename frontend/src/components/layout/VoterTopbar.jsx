import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock3,
  Menu,
  MessageCircle,
  Send,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import { systemNotificationService } from "../../services/systemNotification.service";
import { publicChatService } from "../../services/publicChat.service";
import { getApiErrorMessage } from "../../lib/utils";

const SYSTEM_NOTIFICATION_LIMIT = 10;
const CHAT_MESSAGE_LIMIT = 20;

const CHAT_EVENT_NAMES = {
  messageCreated: "public_chat_message_created",
  messageDeleted: "public_chat_message_deleted",
  userBlocked: "public_chat_user_blocked",
  userUnblocked: "public_chat_user_unblocked",
};

const pageMetaMap = {
  "/voter": {
    eyebrow: "Overview",
    title: "Dashboard",
  },
  "/voter/elections": {
    eyebrow: "Voting",
    title: "Published Elections",
  },
  "/voter/my-votes": {
    eyebrow: "History",
    title: "My Votes",
  },
  "/voter/results": {
    eyebrow: "Final results",
    title: "Election Results",
  },
  "/voter/profile": {
    eyebrow: "Account",
    title: "Profile",
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

function getNotificationClass(type) {
  if (type === "success") return "voter-notification-item--success";
  if (type === "warning") return "voter-notification-item--warning";
  if (type === "danger") return "voter-notification-item--danger";
  return "voter-notification-item--info";
}

function getInitials(name = "User") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function normalizeMessages(messages = []) {
  const map = new Map();

  for (const message of messages) {
    if (!message?._id || message?.isDeleted) continue;
    map.set(String(message._id), message);
  }

  return Array.from(map.values()).sort((first, second) => {
    return (
      new Date(first?.createdAt || 0).getTime() -
      new Date(second?.createdAt || 0).getTime()
    );
  });
}

export default function VoterTopbar({ onOpenSidebar = () => {} }) {
  const location = useLocation();
  const { user } = useAuth();

  const dropdownRef = useRef(null);
  const chatEndRef = useRef(null);
  const eventSourceRef = useRef(null);

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
  const [deletingNotificationId, setDeletingNotificationId] = useState("");
  const [isClearingRead, setIsClearingRead] = useState(false);
  const [isChatLiveConnected, setIsChatLiveConnected] = useState(false);
  const [isChatUsingFallback, setIsChatUsingFallback] = useState(false);

  const meta = useMemo(() => {
    if (location.pathname.startsWith("/voter/elections/")) {
      return {
        eyebrow: "Ballot room",
        title: "Election Details",
      };
    }

    return (
      pageMetaMap[location.pathname] || {
        eyebrow: "Voter",
        title: "Workspace",
      }
    );
  }, [location.pathname]);

  const initials = useMemo(
    () => getInitials(user?.fullName || "Voter"),
    [user?.fullName],
  );

  const isApproved =
    String(user?.verificationStatus || "").toLowerCase() === "approved";

  const isEligible = Boolean(user?.isEligibleToVote);

  const orderedChatMessages = useMemo(() => {
    return normalizeMessages(chatMessages);
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
        normalizeMessages(
          Array.isArray(messagesData?.items) ? messagesData.items : [],
        ),
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

  const closePublicChatStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsChatLiveConnected(false);
  };

  const applyPublicChatEvent = (eventPayload) => {
    const eventType = eventPayload?.eventType;
    const payload = eventPayload?.payload;

    if (!eventType) return;

    if (eventType === CHAT_EVENT_NAMES.messageCreated && payload?._id) {
      setChatMessages((currentMessages) =>
        normalizeMessages([...currentMessages, payload]),
      );
      return;
    }

    if (eventType === CHAT_EVENT_NAMES.messageDeleted && payload?._id) {
      setChatMessages((currentMessages) =>
        currentMessages.filter(
          (message) => String(message?._id) !== String(payload._id),
        ),
      );
      return;
    }

    if (
      eventType === CHAT_EVENT_NAMES.userBlocked ||
      eventType === CHAT_EVENT_NAMES.userUnblocked
    ) {
      loadPublicChat({ silent: true });
    }
  };

  const connectPublicChatStream = () => {
    closePublicChatStream();

    const eventSource = publicChatService.createPublicChatStream({
      onOpen: () => {
        setIsChatLiveConnected(true);
        setIsChatUsingFallback(false);
      },
      onEvent: applyPublicChatEvent,
      onError: () => {
        setIsChatLiveConnected(false);
        setIsChatUsingFallback(true);
      },
    });

    if (!eventSource) {
      setIsChatLiveConnected(false);
      setIsChatUsingFallback(true);
      return;
    }

    eventSourceRef.current = eventSource;
  };

  useEffect(() => {
    loadSystemNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?._id,
    user?.verificationStatus,
    user?.isEligibleToVote,
    user?.mobileVerified,
    user?.ageVerified,
  ]);

  useEffect(() => {
    if (!isDropdownOpen || activeBellTab !== "chat") {
      closePublicChatStream();
      setIsChatUsingFallback(false);
      return undefined;
    }

    loadPublicChat();
    connectPublicChatStream();

    return () => {
      closePublicChatStream();
      setIsChatUsingFallback(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen, activeBellTab]);

  useEffect(() => {
    if (!isDropdownOpen || activeBellTab !== "chat" || !isChatUsingFallback) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadPublicChat({ silent: true });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen, activeBellTab, isChatUsingFallback]);

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

  useEffect(() => {
    return () => {
      closePublicChatStream();
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
      closePublicChatStream();
      setIsChatUsingFallback(false);
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

  const handleClearRead = async () => {
    try {
      setIsClearingRead(true);

      const data = await systemNotificationService.clearReadNotifications();
      await loadSystemNotifications();

      toast.success(`${data?.deletedCount || 0} read notification(s) deleted.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsClearingRead(false);
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

  const handleDeleteNotification = async (event, notificationId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!notificationId) return;

    try {
      setDeletingNotificationId(notificationId);

      await systemNotificationService.deleteNotification(notificationId);
      await loadSystemNotifications();

      toast.success("Notification deleted.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeletingNotificationId("");
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

      if (!isChatLiveConnected) {
        await loadPublicChat({ silent: true });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <header className="voter-topbar-clean">
      <div className="voter-topbar-clean__left">
        <button
          type="button"
          className="voter-topbar-clean__menu"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <span>{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
        </div>
      </div>

      <div className="voter-topbar-clean__right">
        <div className="voter-topbar-clean__status">
          <span
            className={
              isApproved
                ? "voter-topbar-clean__chip voter-topbar-clean__chip--success"
                : "voter-topbar-clean__chip voter-topbar-clean__chip--warning"
            }
          >
            <ShieldCheck size={14} />
            {getStatusLabel(user?.verificationStatus)}
          </span>

          <span
            className={
              isEligible
                ? "voter-topbar-clean__chip voter-topbar-clean__chip--success"
                : "voter-topbar-clean__chip voter-topbar-clean__chip--danger"
            }
          >
            {isEligible ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {isEligible ? "Eligible" : "Restricted"}
          </span>
        </div>

        <div className="voter-notification-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="voter-topbar-clean__notification voter-notification-button"
            aria-label="Notifications and public chat"
            onClick={handleToggleDropdown}
          >
            <Bell size={17} />

            {systemUnreadCount > 0 ? (
              <span className="voter-notification-button__badge">
                {systemUnreadCount > 9 ? "9+" : systemUnreadCount}
              </span>
            ) : null}
          </button>

          {isDropdownOpen && (
            <div className="voter-notification-dropdown voter-notification-dropdown--wide">
              <div className="voter-notification-dropdown__header">
                <div>
                  <strong>Voter Center</strong>
                  <span>
                    {systemUnreadCount} unread system notification
                    {systemUnreadCount === 1 ? "" : "s"}
                  </span>
                </div>

                {activeBellTab === "system" ? (
                  <div className="voter-notification-header-actions">
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={!systemNotifications.length}
                    >
                      Mark all read
                    </button>

                    <button
                      type="button"
                      onClick={handleClearRead}
                      disabled={isClearingRead}
                    >
                      Clear read
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="voter-bell-tabs" role="tablist">
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
                <div className="voter-notification-dropdown__body">
                  {isLoadingSystem ? (
                    <div className="voter-notification-empty">
                      Loading system notifications...
                    </div>
                  ) : systemNotifications.length ? (
                    systemNotifications.map((notification) => {
                      const content = (
                        <article
                          className={[
                            "voter-notification-item",
                            "voter-notification-item--with-action",
                            getNotificationClass(notification.type),
                            !notification.isRead
                              ? "voter-notification-item--unread"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <div className="voter-notification-item__dot" />

                          <div>
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>

                            <div className="voter-notification-item__meta">
                              <span>
                                <Clock3 size={12} />
                                {formatDateTime(notification.createdAt)}
                              </span>

                              {!notification.isRead ? (
                                <strong>Unread</strong>
                              ) : null}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="voter-notification-delete-btn"
                            title="Delete notification"
                            disabled={
                              deletingNotificationId === notification._id
                            }
                            onClick={(event) =>
                              handleDeleteNotification(event, notification._id)
                            }
                          >
                            <Trash2 size={14} />
                          </button>
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
                          className="voter-notification-plain-button"
                          onClick={() => handleReadNotification(notification)}
                        >
                          {content}
                        </button>
                      );
                    })
                  ) : (
                    <div className="voter-notification-empty">
                      No system notifications right now.
                    </div>
                  )}
                </div>
              )}

              {activeBellTab === "chat" && (
                <div className="voter-chat-panel">
                  <div className="voter-chat-live-status">
                    {isChatLiveConnected ? (
                      <>
                        <Wifi size={13} />
                        Live connected
                      </>
                    ) : isChatUsingFallback ? (
                      <>
                        <WifiOff size={13} />
                        Live reconnecting • fallback refresh enabled
                      </>
                    ) : (
                      <>
                        <WifiOff size={13} />
                        Connecting live chat...
                      </>
                    )}
                  </div>

                  <div className="voter-chat-panel__body">
                    {isLoadingChat ? (
                      <div className="voter-notification-empty">
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
                                ? "voter-chat-message voter-chat-message--mine"
                                : "voter-chat-message"
                            }
                          >
                            <div className="voter-chat-message__avatar">
                              {sender?.profilePhotoUrl ? (
                                <img
                                  src={sender.profilePhotoUrl}
                                  alt={sender?.fullName || "User"}
                                />
                              ) : (
                                <span>{senderInitials}</span>
                              )}
                            </div>

                            <div className="voter-chat-message__bubble">
                              <div className="voter-chat-message__top">
                                <strong>{sender?.fullName || "User"}</strong>
                                <span>{formatDateTime(message.createdAt)}</span>
                              </div>

                              <p>{message.message}</p>
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="voter-notification-empty">
                        No public chat messages yet. Start the conversation.
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {chatStatus.isBlocked ? (
                    <div className="voter-chat-blocked-box">
                      <strong>You are blocked from public chat.</strong>
                      <p>
                        {chatStatus?.block?.reason ||
                          "Admin has disabled your ability to send messages."}
                      </p>
                    </div>
                  ) : (
                    <form className="voter-chat-form" onSubmit={handleSendChat}>
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

              <div className="voter-notification-dropdown__footer">
                {activeBellTab === "system" ? (
                  <Link
                    to={APP_ROUTES.VOTER_ELECTIONS}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    View election center
                  </Link>
                ) : (
                  <span>
                    Public chat is live when connected. Fallback refresh runs if
                    live stream fails.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="voter-topbar-clean__profile">
          <div className="voter-topbar-clean__avatar voter-topbar-clean__avatar--photo">
            {user?.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt={user?.fullName || "Voter"} />
            ) : (
              <span>{initials || "VT"}</span>
            )}
          </div>

          <div>
            <strong>{user?.fullName || "Voter"}</strong>
            <span>
              <BadgeCheck size={13} />
              {user?.internalVoterId || "Voter"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
