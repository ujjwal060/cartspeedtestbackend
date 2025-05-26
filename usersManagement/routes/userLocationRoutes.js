import express from 'express';
import {addOrUpdateUserLocation, getAccessibleArea} from '../controllers/userLocationController.js';

const router = express.Router();

router.post('/addLocation', addOrUpdateUserLocation);
router.get('/accessibleArea', getAccessibleArea);

export default router;