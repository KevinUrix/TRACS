const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');

router.get('/descargar-json', downloadController.getDownloads);

module.exports = router;
