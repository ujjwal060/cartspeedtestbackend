import express from 'express';
import {
    getAllUsers
}from "../controllers/usersController.js";


const router = express.Router();

router.post('/getAll',getAllUsers);

export default router;