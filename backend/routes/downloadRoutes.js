const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/descargar-json', authMiddleware, downloadController.getDownloads);

module.exports = router;
