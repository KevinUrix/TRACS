const express = require('express');
const router = express.Router();
const { getCycles } = require('../controllers/cyclesController');

router.get('/cycles', getCycles);

module.exports = router;
