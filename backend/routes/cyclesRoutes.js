const express = require('express');
const router = express.Router();
const { getCycles } = require('../controllers/cyclesController');
const { localCycles } = require('../controllers/localCyclesController');


router.get('/cycles', getCycles);
router.get('/cycles/local', localCycles);

module.exports = router;
