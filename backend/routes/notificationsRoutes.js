const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

router.get('/notifications', notificationsController.getNotifications);
router.post('/notifications/mark-read', notificationsController.markAsRead);

module.exports = router;
