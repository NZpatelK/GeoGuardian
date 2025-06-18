import express from 'express';
import animalController from '../controllers/animalController.js';

const router = express.Router();

router.get('/getAnimals', animalController.getAnimals);
router.post('/addAnimal', animalController.addAnimal);
router.put('/updateAnimalCoordinates/:id', animalController.updateAnimalCoordinates);
router.put('/relocateAnimal', animalController.relocateAnimal);
router.delete('/deleteAnimal/:id', animalController.deleteAnimal);

export default router; 
