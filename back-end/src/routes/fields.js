const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');

router.get('/getFields', fieldController.getFields);
router.post('/addField', fieldController.addField);

module.exports = router;