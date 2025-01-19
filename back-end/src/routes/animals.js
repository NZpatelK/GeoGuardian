const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');

router.get('/getAnimals', animalController.getAnimals);
router.post('/addAnimal', animalController.addAnimal);

module.exports = router;