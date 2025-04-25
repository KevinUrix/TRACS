const express = require('express');
const router = express.Router();
const { saveReservation, deleteReservation, updateReservation } = require('../controllers/reservationsController');

router.post('/reservations', saveReservation);
router.delete('/reservations', deleteReservation);
router.put('/reservations', updateReservation);

module.exports = router;
