import express from 'express';
import {addOrUpdateUserLocation,gateLocationGeofence} from '../controllers/userLocationController.js';

const router = express.Router();

router.post('/addLocation', addOrUpdateUserLocation);
router.get('/getGeofence', gateLocationGeofence);

export default router;