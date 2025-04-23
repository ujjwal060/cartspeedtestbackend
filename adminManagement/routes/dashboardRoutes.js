import express from 'express';
import {
    getUserStats
}from "../controllers/dashboardDataController.js";


const router = express.Router();

router.get('/getAll',getUserStats);

export default router;