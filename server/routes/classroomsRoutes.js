const express = require('express');
const router = express.Router();
const { getClassrooms } = require('../controllers/classroomsController');

router.get('/classrooms', getClassrooms);

module.exports = router;
