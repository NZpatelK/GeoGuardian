import express from 'express';
import pastureController from '../controllers/pastureController.js';

const router = express.Router();

router.get('/getPastures', pastureController.getPastures);
router.get('/getPastureById/:id', pastureController.getPastureById);
router.post('/addPasture', pastureController.addPasture);
router.put('/updatePasture', pastureController.updatePasture);
router.delete('/deletePasture/:id', pastureController.deletePasture);

export default router;