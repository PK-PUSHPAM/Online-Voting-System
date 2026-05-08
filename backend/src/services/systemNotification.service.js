import mongoose from "mongoose";
import User from "../models/User.js";
import SystemNotification from "../models/SystemNotification.js";

const normalizeObjectIds = (ids = []) => {
  return Array.from(
    new Set(
      ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => String(id)),
    ),
  );
};

export const createSystemNotification = async ({
  recipientId,
  title,
  message,
  type = "info",
  link = "",
  createdBy = null,
  source = "system",
}) => {
  try {
    if (!recipientId || !title || !message) return null;

    return await SystemNotification.create({
      recipientId,
      title,
      message,
      type,
      link,
      createdBy,
      source,
    });
  } catch (error) {
    console.warn(`System notification creation failed: ${error.message}`);
    return null;
  }
};

export const createSystemNotificationsForMany = async ({
  recipientIds = [],
  title,
  message,
  type = "info",
  link = "",
  createdBy = null,
  source = "system",
}) => {
  try {
    const uniqueRecipientIds = normalizeObjectIds(recipientIds);

    if (!uniqueRecipientIds.length || !title || !message) {
      return [];
    }

    const notifications = uniqueRecipientIds.map((recipientId) => ({
      recipientId,
      title,
      message,
      type,
      link,
      createdBy,
      source,
    }));

    return await SystemNotification.insertMany(notifications, {
      ordered: false,
    });
  } catch (error) {
    console.warn(`Bulk system notification creation failed: ${error.message}`);
    return [];
  }
};

export const createSystemNotificationsForRoles = async ({
  roles = [],
  title,
  message,
  type = "info",
  link = "",
  createdBy = null,
  source = "system",
}) => {
  try {
    if (!roles.length || !title || !message) return [];

    const users = await User.find({
      role: { $in: roles },
      isActive: true,
    }).select("_id");

    return createSystemNotificationsForMany({
      recipientIds: users.map((user) => user._id),
      title,
      message,
      type,
      link,
      createdBy,
      source,
    });
  } catch (error) {
    console.warn(`Role notification creation failed: ${error.message}`);
    return [];
  }
};

export const createElectionNotificationsForVisibleVoters = async ({
  election,
  title,
  message,
  type = "info",
  link = "",
  createdBy = null,
  source = "election",
}) => {
  try {
    if (!election?._id || !title || !message) return [];

    const voterFilter = {
      role: "voter",
      isActive: true,
    };

    if (election.allowedVoterType === "verifiedOnly") {
      voterFilter.verificationStatus = "approved";
      voterFilter.isEligibleToVote = true;
      voterFilter.mobileVerified = true;
      voterFilter.ageVerified = true;
    }

    const voters = await User.find(voterFilter).select("_id");

    return createSystemNotificationsForMany({
      recipientIds: voters.map((voter) => voter._id),
      title,
      message,
      type,
      link,
      createdBy,
      source,
    });
  } catch (error) {
    console.warn(`Election notification creation failed: ${error.message}`);
    return [];
  }
};
