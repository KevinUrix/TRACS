const express = require('express');
const router = express.Router();
const { getBuildings, deleteBuilding, updateBuilding, saveBuilding } = require('../controllers/buildingsController');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/buildings', getBuildings);
router.delete('/buildings', authMiddleware, deleteBuilding);
router.put('/buildings', authMiddleware, updateBuilding);
router.post('/buildings', authMiddleware, saveBuilding);

module.exports = router;
