const express = require('express');
const router = express.Router();
const pastureController = require('../controllers/pastureController');

router.get('/getPastures', pastureController.getPastures);
router.post('/addPasture', pastureController.addPasture);

module.exports = router;