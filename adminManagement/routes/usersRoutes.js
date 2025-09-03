import express from 'express';
import {
    getAllUsers,
    deleteUser,
    findUserByAdminLocation
}from "../controllers/usersController.js";


const router = express.Router();

router.post('/getAll',getAllUsers);
router.delete('/delete/:id',deleteUser);
router.get('/byAdminLocation',findUserByAdminLocation);

export default router;