const Notification = require("../models/Notification");

async function createNotification({
    userId,
    title,
    body,
    type = "system",
    severity = "info",
    deepLink = "",
    metadata = {},
}) {
    return Notification.create({
        userId,
        title,
        body,
        type,
        severity,
        deepLink,
        metadata,
    });
}

async function getNotifications(userId, limit = 20) {
    return Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
}

async function getUnreadCount(userId) {
    return Notification.countDocuments({
        userId,
        isRead: false,
    });
}

async function markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
        {
            _id: notificationId,
            userId,
        },
        {
            isRead: true,
        },
        {
            new: true,
        }
    );
}

async function markAllAsRead(userId) {
    return Notification.updateMany(
        {
            userId,
            isRead: false,
        },
        {
            isRead: true,
        }
    );
}

module.exports = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};