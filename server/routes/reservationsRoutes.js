const express = require('express');
const router = express.Router();
const { saveReservation, deleteReservation, updateReservation, getReservations } = require('../controllers/reservationsController');

router.post('/reservations', saveReservation);
router.delete('/reservations', deleteReservation);
router.put('/reservations', updateReservation);
router.get('/reservations', getReservations);

module.exports = router;
