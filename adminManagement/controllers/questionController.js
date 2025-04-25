import QuestionModel from "../models/questionModel.js";
import { logger } from "../../utils/logger.js";

const createQuestion = async (req, res) => {
    try {
        const { state, level, question, options,videoId } = req.body;
        if (!options || !level || !state || !question) {
            logger.warn('Missing required fields in createQuestion');
            return res.status(400).json({
                status: 400,
                message: ['Required fields are missing.'],
            });
        }

        const newQuestion = new QuestionModel({
            level,
            question,
            options,
            state,
            videoId
        });

        await newQuestion.save();

        logger.info('Question created successfully');
        return res.status(201).json({
            status: 201,
            message: ['Question created successfully'],
            data: newQuestion
        });
    } catch (error) {
        logger.error(`createQuestion Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getAllQuestions = async (req, res) => {
    try {
        const { filters, offset, limit } = req.body;
        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);
        let aggregation = [];

        if (filters?.level) {
            aggregation.push({
                $match: {
                    level: filters?.level
                }
            })
        }
        if (filters?.state) {
            aggregation.push({
                $match: {
                    state: filters?.state
                }
            })
        }
        if (filters?.videoId) {
            aggregation.push({
                $match: {
                    videoId: filters?.videoId
                }
            })
        }

        aggregation.push({
            $sort: { createdAt: -1 }
        });

        aggregation.push({
            $facet: {
                data: [
                    { $skip: parsedOffset },
                    { $limit: parsedLimit }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        });

        const [result] = await QuestionModel.aggregate(aggregation);
        const total = result.totalCount[0]?.count || 0;
        logger.info(`Fetched ${result.data.length} questions`);

        return res.status(200).json({
            status: 200,
            message: ['Questions fetched successfully'],
            data: result.data,
            total
        });

    } catch (error) {
        logger.error(`getQuestion Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const updateQuestion = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedQuestion = await QuestionModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedQuestion) {
            logger.warn(`Question not found for update. ID: ${id}`);
            return res.status(404).json({
                status: 404,
                message: ['Question not found'],
            });
        }

        logger.info(`Question updated successfully. ID: ${id}`);
        return res.status(200).json({
            status: 200,
            message: ['Question updated successfully'],
            data: updatedQuestion,
        });

    } catch (error) {
        logger.error(`updateQuestion Error for ID: ${req.params.id} — ${error.message}`)
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    createQuestion,
    getAllQuestions,
    updateQuestion
}