const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getNotifications);
router.post('/mark-read', notificationController.markAllAsRead);

module.exports = router;