const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');

router.get('/getAnimals', animalController.getAnimals);
router.post('/addAnimal', animalController.addAnimal);
router.put('/updateAnimalCoordinates/:id', animalController.updateAnimalCoordinates);
router.put('/relocateAnimal', animalController.relocateAnimal);
router.delete('/deleteAnimal/:id', animalController.deleteAnimal);

module.exports = router;