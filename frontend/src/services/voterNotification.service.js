import { voterService } from "./voter.service";

const READ_NOTIFICATION_STORAGE_KEY = "online-voting-voter-read-notifications";

function getReadNotificationIds() {
  try {
    const rawValue = localStorage.getItem(READ_NOTIFICATION_STORAGE_KEY);
    const parsedValue = JSON.parse(rawValue || "[]");

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveReadNotificationIds(ids) {
  localStorage.setItem(
    READ_NOTIFICATION_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(ids))),
  );
}

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

function buildProfileNotifications(user) {
  const notifications = [];
  const verificationStatus = String(user?.verificationStatus || "pending");

  if (!user?.mobileVerified) {
    notifications.push({
      id: "profile-mobile-verification-pending",
      type: "warning",
      title: "Mobile verification pending",
      message: "Verify your mobile number to avoid voting access issues.",
      createdAt: user?.updatedAt || user?.createdAt || new Date().toISOString(),
    });
  }

  if (!user?.ageVerified) {
    notifications.push({
      id: "profile-age-verification-pending",
      type: "warning",
      title: "Age verification pending",
      message: "Your age verification is still pending.",
      createdAt: user?.updatedAt || user?.createdAt || new Date().toISOString(),
    });
  }

  if (verificationStatus === "pending") {
    notifications.push({
      id: "profile-admin-approval-pending",
      type: "info",
      title: "Admin approval pending",
      message: "Your voter profile is waiting for admin approval.",
      createdAt: user?.updatedAt || user?.createdAt || new Date().toISOString(),
    });
  }

  if (verificationStatus === "rejected") {
    notifications.push({
      id: "profile-verification-rejected",
      type: "danger",
      title: "Profile verification rejected",
      message:
        user?.verificationRejectionReason ||
        "Your verification was rejected. Check your profile details.",
      createdAt: user?.updatedAt || user?.createdAt || new Date().toISOString(),
    });
  }

  if (!user?.isEligibleToVote) {
    notifications.push({
      id: "profile-eligibility-pending",
      type: "warning",
      title: "Voting eligibility not cleared",
      message: "Your account is not currently eligible to cast votes.",
      createdAt: user?.updatedAt || user?.createdAt || new Date().toISOString(),
    });
  }

  return notifications;
}

function buildElectionNotifications(elections = []) {
  const upcomingElections = elections
    .filter((election) => election?.status === "upcoming")
    .sort((first, second) => {
      return (
        new Date(first?.startDate || 0).getTime() -
        new Date(second?.startDate || 0).getTime()
      );
    });

  const activeElections = elections
    .filter((election) => election?.status === "active")
    .sort((first, second) => {
      return (
        new Date(first?.endDate || 0).getTime() -
        new Date(second?.endDate || 0).getTime()
      );
    });

  const notifications = [];

  for (const election of activeElections.slice(0, 5)) {
    notifications.push({
      id: `election-active-${election._id}`,
      type: "success",
      title: "Election is active now",
      message: `${election?.title || "Election"} is open for voting until ${formatDate(
        election?.endDate,
      )}.`,
      createdAt: election?.startDate || new Date().toISOString(),
      electionId: election?._id,
      actionLabel: "Open ballot",
    });
  }

  for (const election of upcomingElections.slice(0, 5)) {
    notifications.push({
      id: `election-upcoming-${election._id}`,
      type: "info",
      title: "Upcoming election published",
      message: `${election?.title || "Election"} will start on ${formatDate(
        election?.startDate,
      )}. You can preview posts and candidates now.`,
      createdAt:
        election?.createdAt || election?.startDate || new Date().toISOString(),
      electionId: election?._id,
      actionLabel: "Preview",
    });
  }

  return notifications;
}

export const voterNotificationService = {
  async getVoterNotifications(user) {
    const publishedElectionData = await voterService.getPublishedElections();
    const elections = Array.isArray(publishedElectionData?.elections)
      ? publishedElectionData.elections
      : [];

    const readIds = getReadNotificationIds();

    const notifications = [
      ...buildProfileNotifications(user),
      ...buildElectionNotifications(elections),
    ]
      .map((notification) => ({
        ...notification,
        isRead: readIds.includes(notification.id),
      }))
      .sort((first, second) => {
        return (
          new Date(second?.createdAt || 0).getTime() -
          new Date(first?.createdAt || 0).getTime()
        );
      });

    return {
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead)
        .length,
    };
  },

  markAllAsRead(notifications = []) {
    const existingReadIds = getReadNotificationIds();
    const notificationIds = notifications.map(
      (notification) => notification.id,
    );
    saveReadNotificationIds([...existingReadIds, ...notificationIds]);
  },

  markOneAsRead(notificationId) {
    if (!notificationId) return;

    const existingReadIds = getReadNotificationIds();
    saveReadNotificationIds([...existingReadIds, notificationId]);
  },
};
