const express = require('express');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

router.get('/schedule', scheduleController.getSchedule);

module.exports = router;
