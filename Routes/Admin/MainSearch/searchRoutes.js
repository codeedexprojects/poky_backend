const express = require('express');
const router = express.Router();
const searchController = require('../../../Controllers/Admin/MainSearch/searchController')


router.get('/view',searchController.MainSearch)

module.exports = router;