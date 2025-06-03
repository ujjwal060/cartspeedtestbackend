import express from 'express';
import {
    createQuestion,
    getAllQuestions,
    updateQuestion,
    getVideosForDropdown,
    deleteQuestion
} from '../controllers/questionController.js'

const router = express.Router();

router.post('/add',createQuestion);
router.post('/getQA',getAllQuestions);
router.put('/:id', updateQuestion);
router.post('/getVideos',getVideosForDropdown);
router.delete('/deleteQ/:questionId',deleteQuestion)

export default router;