const express = require('express');
const router = express.Router();
const { saveReservation, deleteReservation, updateReservation, getReservations } = require('../controllers/reservationsController');
const authMiddleware = require('../middleware/authMiddleware');
const authRole = require('../middleware/authRole');


router.post('/reservations', authMiddleware, authRole(['user', 'superuser']), saveReservation);
router.delete('/reservations', authMiddleware, authRole(['user', 'superuser']), deleteReservation);
router.put('/reservations', authMiddleware, authRole(['user', 'superuser']), updateReservation);
router.get('/reservations', getReservations);

module.exports = router;
