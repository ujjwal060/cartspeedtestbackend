import express from 'express';
import {
    createQuestion,
    getAllQuestions,
    updateQuestion
} from '../controllers/questionController.js'

const router = express.Router();

router.post('/add',createQuestion);
router.post('/getQA',getAllQuestions);
router.put('/:id', updateQuestion);

export default router;