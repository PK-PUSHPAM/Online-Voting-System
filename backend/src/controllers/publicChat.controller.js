import { EventEmitter } from "events";
import User from "../models/User.js";
import PublicChatMessage from "../models/PublicChatMessage.js";
import PublicChatBlock from "../models/PublicChatBlock.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

const publicChatEvents = new EventEmitter();
publicChatEvents.setMaxListeners(1000);

const CHAT_EVENT_NAMES = {
  messageCreated: "public_chat_message_created",
  messageDeleted: "public_chat_message_deleted",
  userBlocked: "public_chat_user_blocked",
  userUnblocked: "public_chat_user_unblocked",
};

const getPublicMessagePayload = async (messageId) => {
  return PublicChatMessage.findById(messageId)
    .populate("senderId", "fullName email role profilePhotoUrl internalVoterId")
    .populate("deletedBy", "fullName email role");
};

const isUserBlockedFromChat = async (userId) => {
  const block = await PublicChatBlock.findOne({
    userId,
    isActive: true,
  }).populate("blockedBy", "fullName email role");

  return block;
};

const emitPublicChatEvent = (eventType, payload) => {
  publicChatEvents.emit("public_chat_event", {
    eventType,
    payload,
    timestamp: new Date().toISOString(),
  });
};

export const getMyPublicChatStatus = asyncHandler(async (req, res) => {
  const block = await isUserBlockedFromChat(req.user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isBlocked: Boolean(block),
        block,
      },
      "Public chat status fetched successfully",
    ),
  );
});

export const getPublicChatMessages = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip } = buildPagination({
    ...query,
    sortBy: "createdAt",
    sortType: query.sortType || "desc",
  });

  const filter = {};

  if (query.includeDeleted !== true) {
    filter.isDeleted = false;
  }

  const [totalItems, messages] = await Promise.all([
    PublicChatMessage.countDocuments(filter),
    PublicChatMessage.find(filter)
      .populate(
        "senderId",
        "fullName email role profilePhotoUrl internalVoterId",
      )
      .populate("deletedBy", "fullName email role")
      .sort({ createdAt: query.sortType === "asc" ? 1 : -1 })
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
        items: messages,
        pagination,
      },
      "Public chat messages fetched successfully",
    ),
  );
});

export const sendPublicChatMessage = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };

  const activeBlock = await isUserBlockedFromChat(req.user._id);

  if (activeBlock) {
    throw new ApiError(
      403,
      activeBlock.reason
        ? `You are blocked from public chat. Reason: ${activeBlock.reason}`
        : "You are blocked from public chat",
    );
  }

  const message = await PublicChatMessage.create({
    senderId: req.user._id,
    message: body.message.trim(),
  });

  const populatedMessage = await getPublicMessagePayload(message._id);

  emitPublicChatEvent(CHAT_EVENT_NAMES.messageCreated, populatedMessage);

  return res
    .status(201)
    .json(new ApiResponse(201, populatedMessage, "Message sent successfully"));
});

export const deletePublicChatMessage = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };

  const message = await PublicChatMessage.findById(params.messageId);

  if (!message) {
    throw new ApiError(404, "Chat message not found");
  }

  if (message.isDeleted) {
    throw new ApiError(400, "Message is already deleted");
  }

  message.isDeleted = true;
  message.deletedBy = req.user._id;
  message.deletedAt = new Date();
  message.deleteReason = body.reason?.trim() || "";

  await message.save();

  const populatedMessage = await getPublicMessagePayload(message._id);

  emitPublicChatEvent(CHAT_EVENT_NAMES.messageDeleted, populatedMessage);

  return res
    .status(200)
    .json(new ApiResponse(200, populatedMessage, "Message deleted"));
});

export const blockUserFromPublicChat = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };

  if (String(params.userId) === String(req.user._id)) {
    throw new ApiError(400, "You cannot block yourself from public chat");
  }

  const targetUser = await User.findById(params.userId).select(
    "_id fullName email role isActive",
  );

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  if (!targetUser.isActive) {
    throw new ApiError(400, "Inactive user cannot be blocked from chat");
  }

  if (targetUser.role === "super_admin" && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can block another super admin");
  }

  const existingBlock = await PublicChatBlock.findOne({
    userId: targetUser._id,
    isActive: true,
  });

  if (existingBlock) {
    throw new ApiError(400, "User is already blocked from public chat");
  }

  const block = await PublicChatBlock.create({
    userId: targetUser._id,
    blockedBy: req.user._id,
    reason: body.reason?.trim() || "",
    isActive: true,
  });

  const populatedBlock = await PublicChatBlock.findById(block._id)
    .populate("userId", "fullName email role")
    .populate("blockedBy", "fullName email role");

  emitPublicChatEvent(CHAT_EVENT_NAMES.userBlocked, populatedBlock);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        populatedBlock,
        "User blocked from public chat successfully",
      ),
    );
});

export const unblockUserFromPublicChat = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };

  const block = await PublicChatBlock.findOne({
    userId: params.userId,
    isActive: true,
  });

  if (!block) {
    throw new ApiError(404, "Active chat block not found for this user");
  }

  block.isActive = false;
  block.unblockedBy = req.user._id;
  block.unblockedAt = new Date();

  await block.save();

  const populatedBlock = await PublicChatBlock.findById(block._id)
    .populate("userId", "fullName email role")
    .populate("blockedBy", "fullName email role")
    .populate("unblockedBy", "fullName email role");

  emitPublicChatEvent(CHAT_EVENT_NAMES.userUnblocked, populatedBlock);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        populatedBlock,
        "User unblocked from public chat successfully",
      ),
    );
});

export const getPublicChatBlockedUsers = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip, sort } = buildPagination(query);

  const filter = {
    isActive: true,
  };

  const [totalItems, blocks] = await Promise.all([
    PublicChatBlock.countDocuments(filter),
    PublicChatBlock.find(filter)
      .populate("userId", "fullName email role profilePhotoUrl")
      .populate("blockedBy", "fullName email role")
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
        items: blocks,
        pagination,
      },
      "Blocked public chat users fetched successfully",
    ),
  );
});

export const streamPublicChatEvents = asyncHandler(async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      success: true,
      message: "Connected to public chat stream",
      timestamp: new Date().toISOString(),
    })}\n\n`,
  );

  const sendEvent = (eventPayload) => {
    res.write(`event: public_chat_event\n`);
    res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
  };

  publicChatEvents.on("public_chat_event", sendEvent);

  const heartbeat = setInterval(() => {
    res.write(
      `event: heartbeat\ndata: ${JSON.stringify({
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    publicChatEvents.off("public_chat_event", sendEvent);
    res.end();
  });
});
