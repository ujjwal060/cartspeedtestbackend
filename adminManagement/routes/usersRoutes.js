import express from 'express';
import {
    getAllUsers,
    deleteUser,
    findUserByAdminLocation,
    getLatestUsers
}from "../controllers/usersController.js";


const router = express.Router();

router.post('/getAll',getAllUsers);
router.delete('/delete/:id',deleteUser);
router.get('/byAdminLocation',findUserByAdminLocation);
router.get('/latest', getLatestUsers);

export default router;