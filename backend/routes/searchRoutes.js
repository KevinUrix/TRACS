const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.get('/search', searchController.getSearch);

module.exports = router;
