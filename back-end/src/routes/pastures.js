const express = require('express');
const router = express.Router();
const pastureController = require('../controllers/pastureController');

router.get('/getPastures', pastureController.getPastures);
router.get('/getPastureById/:id', pastureController.getPastureById);
router.post('/addPasture', pastureController.addPasture);
router.put('/updatePasture', pastureController.updatePasture);
router.delete('/deletePasture/:id', pastureController.deletePasture);

module.exports = router;