const express = require('express');
const router = express.Router();
const { getBuildings } = require('../controllers/buildingsController');

router.get('/buildings', getBuildings);

module.exports = router;
