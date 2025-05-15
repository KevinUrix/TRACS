const express = require('express');
const router = express.Router();
const { getBuildings, deleteBuilding } = require('../controllers/buildingsController');

router.get('/buildings', getBuildings);
router.delete('/buildings', deleteBuilding);

module.exports = router;
