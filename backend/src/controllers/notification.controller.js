import mongoose from "mongoose";
import User from "../models/User.js";
import SystemNotification from "../models/SystemNotification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

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
  if (!recipientId || !title || !message) return null;

  return SystemNotification.create({
    recipientId,
    title,
    message,
    type,
    link,
    createdBy,
    source,
  });
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

  return SystemNotification.insertMany(notifications);
};

export const getMySystemNotifications = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip, sort } = buildPagination(query);

  const filter = {
    recipientId: req.user._id,
  };

  if (query.unreadOnly === true) {
    filter.isRead = false;
  }

  const [totalItems, unreadCount, notifications] = await Promise.all([
    SystemNotification.countDocuments(filter),
    SystemNotification.countDocuments({
      recipientId: req.user._id,
      isRead: false,
    }),
    SystemNotification.find(filter)
      .populate("createdBy", "fullName email role")
      .sort(sort)
      .skip(skip)
      .limit(limit),
  ]);

  const pagination = buildPaginationResponse({
    totalItems,
    page,
    limit,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: notifications,
        unreadCount,
        pagination,
      },
      "System notifications fetched successfully",
    ),
  );
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { notificationId } = params;

  const notification = await SystemNotification.findOne({
    _id: notificationId,
    recipientId: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await SystemNotification.updateMany(
    {
      recipientId: req.user._id,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        modifiedCount: result.modifiedCount || 0,
      },
      "All system notifications marked as read",
    ),
  );
});

export const createAdminSystemNotification = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };
  const {
    recipientIds = [],
    roles = [],
    title,
    message,
    type = "info",
    link = "",
  } = body;

  const filter = {
    isActive: true,
  };

  const normalizedRecipientIds = normalizeObjectIds(recipientIds);

  if (normalizedRecipientIds.length) {
    filter._id = { $in: normalizedRecipientIds };
  }

  if (roles.length) {
    filter.role = { $in: roles };
  }

  if (!normalizedRecipientIds.length && !roles.length) {
    throw new ApiError(
      400,
      "Either recipientIds or roles is required to create notifications",
    );
  }

  const users = await User.find(filter).select("_id");

  if (!users.length) {
    throw new ApiError(404, "No matching recipients found");
  }

  const notifications = await createSystemNotificationsForMany({
    recipientIds: users.map((user) => user._id),
    title,
    message,
    type,
    link,
    createdBy: req.user._id,
    source: "admin",
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        count: notifications.length,
      },
      "System notification created successfully",
    ),
  );
});
