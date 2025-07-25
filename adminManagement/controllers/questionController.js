import QuestionModel from "../../models/questionModel.js";
import videoModel from "../../models/videosModel.js"
import { logger } from "../../utils/logger.js";
import { ObjectId } from 'bson';

const createQuestion = async (req, res) => {
    try {
        const { question, options, videoId, sectionNumber, locationId, adminId, sectionId } = req.body;
        const role = req.user.role;
        const isSuperAdmin = role === 'superAdmin';

        if (!question || !options || options.length === 0) {
            logger.warn('Missing required base fields in createQuestion');
            return res.status(400).json({
                status: 400,
                message: ['Question text and options are required.'],
            });
        }

        if (!isSuperAdmin) {
            if (!options || !videoId || !question || !locationId || !sectionNumber || !adminId) {
                logger.warn('Missing required fields in createQuestion');
                return res.status(400).json({
                    status: 400,
                    message: ['Required fields are missing.'],
                });
            }
        }


        const newQuestion = new QuestionModel({
            sectionNumber,
            question,
            options,
            videoId,
            locationId,
            adminId,
            sectionId,
            isSuperAdmin
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
        const adminId = req.user.id;
        const role = req.user.role;
        const { filters, offset, limit } = req.body;
        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);
        let aggregation = [];

        if (role == 'admin') {
            aggregation.push({
                $match: {
                    adminId: new ObjectId(adminId)
                }
            });
        }

        if (role === 'superAdmin') {
            aggregation.push({
                $lookup: {
                    from: 'admins',
                    localField: 'adminId',
                    foreignField: '_id',
                    as: 'adminsData'
                },
            });

            aggregation.push({
                $unwind: {
                    path: '$adminsData',
                    preserveNullAndEmptyArrays: true,
                }
            });
        }

        if (filters?.startDate || filters?.endDate) {
            const dateRange = {};

            if (filters.startDate) {
                dateRange.$gte = new Date(new Date(filters.startDate).setHours(0, 0, 0, 0));
            }

            if (filters.endDate) {
                dateRange.$lte = new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
            }

            aggregation.push({
                $match: {
                    createdAt: dateRange
                }
            });
        }

        aggregation.push({
            $lookup: {
                from: 'locations',
                localField: 'locationId',
                foreignField: '_id',
                as: 'locationDetails'
            }
        });

        aggregation.push({
            $unwind: {
                path: '$locationDetails',
                preserveNullAndEmptyArrays: true
            }
        });

        if (filters?.location) {
            aggregation.push({
                $match: {
                    'locationDetails.zipCode': { $regex: filters.location, $options: 'i' }
                }
            });
        }

        if (filters?.sectionNumber) {
            aggregation.push({
                $match: {
                    sectionNumber: filters?.sectionNumber
                }
            })
        }

        aggregation.push({
            $project: {
                question: 1,
                options: 1,
                videoId: 1,
                sectionNumber: 1,
                locationId: 1,
                createdAt: 1,
                updatedAt: 1,
                locationName: '$locationDetails.name',
                adminId: 1,
                adminName: role === 'superAdmin' ? '$adminsData.name' : null,
            }
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

        logger.info(`Fetched ${result.length} questions`);

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

const getVideosForDropdown = async (req, res) => {
    try {
        const { section } = req.body;
        const userId = req.user.id;
        let aggregation = [];

        aggregation.push({
            $match: {
                admin: new ObjectId(userId)
            }
        });

        aggregation.push({
            $unwind: '$sections'
        });

        if (section) {
            aggregation.push({
                $match: {
                    'sections.sectionNumber': parseInt(section)
                }
            });
        }

        aggregation.push({
            $unwind: '$sections.videos'
        });

        aggregation.push({
            $project: {
                vId: '$sections.videos._id',
                sId: '$sections._id',
                title: '$sections.videos.title',
                sectionNumber: '$sections.sectionNumber',
                sectionTitle: '$sections.title',
                location: '$location'
            }
        });

        const result = await videoModel.aggregate(aggregation);

        logger.info(`Fetched ${result.length} videos for user: ${userId}`);

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: result,
        });
    } catch (error) {
        logger.error(`getVideosForDropdown Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const deleteQuestion = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { questionId } = req.params;

        const deletedQuestion = await QuestionModel.findOneAndDelete({
            _id: questionId,
            // adminId: new ObjectId(adminId),
        });
        return res.status(200).json({
            status: 200,
            message: ['Question deleted successfully'],
            data: deletedQuestion
        });

    } catch (error) {
        logger.error(`daleteVideosForDropdown Error`, error.message);
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
    getVideosForDropdown,
    deleteQuestion
}