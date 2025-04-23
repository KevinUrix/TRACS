const express = require('express');
const router = express.Router();
const { saveReservation, deleteReservation } = require('../controllers/reservationsController');

router.post('/reservations', saveReservation);
router.delete('/reservations', deleteReservation);

module.exports = router;
