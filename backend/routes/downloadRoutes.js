const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const authMiddleware = require('../middleware/authMiddleware');
const authRole = require('../middleware/authRole');


router.get('/descargar-json', authMiddleware, authRole(['superuser']), downloadController.getDownloads);

module.exports = router;
