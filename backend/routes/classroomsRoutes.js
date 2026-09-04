const express = require('express');
const router = express.Router();
const { getClassrooms, saveClassrooms, resetAccessibility } = require('../controllers/classroomsController');
const authMiddleware = require('../middleware/authMiddleware');
const authRole = require('../middleware/authRole');

router.get('/classrooms', getClassrooms);
router.post('/classrooms', authMiddleware, authRole(['superuser']), saveClassrooms);
router.put('/classrooms/resetAccessibility', authMiddleware, authRole(['superuser']), resetAccessibility);

module.exports = router;
