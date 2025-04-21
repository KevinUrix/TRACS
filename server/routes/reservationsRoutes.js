const express = require('express');
const router = express.Router();
const { saveReservation } = require('../controllers/reservationsController');

router.post('/reservations', saveReservation);

module.exports = router;
