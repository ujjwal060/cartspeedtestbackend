import express from 'express';
import {
    getAllUsers,
    deleteUser
}from "../controllers/usersController.js";


const router = express.Router();

router.post('/getAll',getAllUsers);
router.delete('/delete/:id',deleteUser);

export default router;