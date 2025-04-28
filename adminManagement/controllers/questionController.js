import QuestionModel from "../models/questionModel.js";
import videoModel from "../models/videosModel.js"
import { logger } from "../../utils/logger.js";
import { ObjectId } from 'bson';

const createQuestion = async (req, res) => {
    try {
        const {level, question, options,videoId,state } = req.body;
            if (!options || !level || !videoId|| !question) {
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
            videoId,
            state
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
                    videoId: new ObjectId(filters?.videoId)
                }
            })
        }

        aggregation.push({
            $lookup: {
                from: 'videos',
                localField: 'videoId',
                foreignField: '_id',
                as: 'videoData'
            }
        });
        
        aggregation.push({
            $unwind: {
                path: '$videoData',
                preserveNullAndEmptyArrays: true
            }
        });

        aggregation.push({
            $project: {
                level: 1,
                state: 1,
                videoId: 1,
                createdAt: 1,
                question:1,
                options:1,
                videoData: {
                    url: '$videoData.url',
                    title: '$videoData.title'
                }
            }
        });

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

const getVideosForDropdown=async(req,res)=>{
     try {
            const {level} = req.body;
            let aggregation = [];
    
            if (level) {
                aggregation.push({
                    $match: {
                        level:level,
                    }
                })
            };
            aggregation.push({
                $match:{
                    isActive:true
                }
            })
            aggregation.push({
                $project: {
                    _id:1,
                    title: 1,
                    locationState: 1,
                    isActive: 1,
                    level:1
                }
            });
    
            const result = await videoModel.aggregate(aggregation);
          
            logger.info(`Fetched ${result.length} videos for user: ${req.user.id}`);
    
            return res.status(200).json({
                status: 200,
                message: ['Videos fetched successfully.'],
                data: result,
            });
        } catch (error) {
            logger.error(`getAllVideos Error`, error.message);
            return res.status(500).json({
                status: 500,
                message: [error.message],
            });
        }
}

export {
    createQuestion,
    getAllQuestions,
    updateQuestion,
    getVideosForDropdown
}