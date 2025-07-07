const express = require('express');
const router = express.Router();
const {localSchedule} = require('../controllers/localScheduleController');

router.get('/local-schedule', localSchedule);

module.exports = router;
