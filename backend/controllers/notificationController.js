const notificationModel = require('../models/notificationModel');

const getNotifications = async (req, res) => {
    const userId = req.user.userId;
    try {
        const notifications = await notificationModel.getNotificationsForUser(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

const markAllAsRead = async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await notificationModel.markAllNotificationsAsRead(userId);
        res.status(200).json({ message: 'All notifications marked as read', count: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
};

module.exports = {
    getNotifications,
    markAllAsRead
};