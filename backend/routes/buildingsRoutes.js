const express = require('express');
const router = express.Router();
const { getBuildings, deleteBuilding, updateBuilding, saveBuilding } = require('../controllers/buildingsController');
const authMiddleware = require('../middleware/authMiddleware');
const authRole = require('../middleware/authRole');


router.get('/buildings', getBuildings);
router.delete('/buildings', authMiddleware, authRole(['superuser']), deleteBuilding);
router.put('/buildings', authMiddleware, authRole(['superuser']), updateBuilding);
router.post('/buildings', authMiddleware, authRole(['superuser']), saveBuilding);

module.exports = router;
