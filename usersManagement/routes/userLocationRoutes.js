import express from 'express';
import {addOrUpdateUserLocation} from '../controllers/userLocationController.js';

const router = express.Router();

router.post('/addLocation', addOrUpdateUserLocation);

export default router;