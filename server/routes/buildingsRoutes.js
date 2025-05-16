const express = require('express');
const router = express.Router();
const { getBuildings, deleteBuilding, updateBuilding, saveBuilding } = require('../controllers/buildingsController');

router.get('/buildings', getBuildings);
router.delete('/buildings', deleteBuilding);
router.put('/buildings', updateBuilding);
router.post('/buildings', saveBuilding);

module.exports = router;
