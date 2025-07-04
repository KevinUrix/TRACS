const express = require('express');
const router = express.Router();
const { saveReservation, deleteReservation, updateReservation, getReservations } = require('../controllers/reservationsController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/reservations', authMiddleware, saveReservation);
router.delete('/reservations', authMiddleware, deleteReservation);
router.put('/reservations', authMiddleware, updateReservation);
router.get('/reservations', getReservations);

module.exports = router;
