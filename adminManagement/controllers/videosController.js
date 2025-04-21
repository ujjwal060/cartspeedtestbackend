import videoModel from "../models/videosModel.js";
import { logger } from "../../utils/logger.js";

const addVideos = async (req, res) => {
    try {
        const { title, description, locationState } = req.body;
        const uploadedBy = req.user.id;
        const url = req.fileLocations[0];

        if (!title || !url || !locationState || !uploadedBy) {
            logger.warn('Missing required fields in addVideos');
            return res.status(400).json({
                status: 400,
                message: ['Required fields are missing.'],
            });
        }

        const newVideo = new videoModel({
            title,
            url,
            description,
            locationState,
            uploadedBy
        });

        const savedVideo = await newVideo.save();
        logger.info(`Video added successfully by user: ${uploadedBy}`);

        return res.status(201).json({
            status: 201,
            message: ['Video uploaded successfully.'],
            data: savedVideo
        });

    } catch (error) {
        logger.error(`addVideos Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getAllVideos = async (req, res) => {
    try {
        const { filters, sortField, sortBy, offset, limit } = req.body;
        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);
        let aggregation = [];

        if (filters?.title) {
            aggregation.push({
                $match: {
                    title: {
                        $regex: filters.title,
                        $options: 'i'
                    }
                }
            })
        };

        if (filters?.locationState) {
            aggregation.push({
                $match: {
                    locationState: {
                        $regex: filters.locationState,
                        $options: 'i'
                    }
                }
            })
        };

        if (filters?.views) {
            aggregation.push({
                $match: {
                    views:parseInt(filters?.views)
                }
            })
        };

        aggregation.push({
            $lookup: {
                from: 'admins',
                localField: 'uploadedBy',
                foreignField: '_id',
                as: 'uploadedBy'
            }
        });
        aggregation.push({ $unwind: '$uploadedBy' });
        aggregation.push({
            $project: {
                title: 1,
                description: 1,
                locationState: 1,
                url: 1,
                views: 1,
                uploadedBy: {
                    name: 1,
                    role: 1
                },
                uploadDate: 1
            }
        });

        if (sortField) {
            aggregation.push({
                $sort: {
                    [sortField]: parseInt(sortBy) === 1 ? 1 : -1
                }
            });
        }

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
        })

        const [result] = await videoModel.aggregate(aggregation);
        const total = result.totalCount[0]?.count || 0;
        logger.info(`Fetched ${result.data.length} videos for user: ${req.user.id}`);

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: result.data,
            total
        });
    } catch (error) {
        logger.error(`getAllVideos Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const deleteVideos = async (req, res) => {
    try {
        const { videoId } = req.params;

        const deletedVideo = await videoModel.findByIdAndDelete(videoId);

        if (!deletedVideo) {
            logger.warn(`Video not found with ID: ${videoId}`);
            return res.status(404).json({
                status: 404,
                message: ['Video not found.'],
            });
        }

        logger.info(`Video deleted: ${videoId} by user: ${req.user.id}`);
        return res.status(200).json({
            status: 200,
            message: ['Video deleted successfully.'],
            data: deletedVideo
        });

    } catch (error) {
        logger.error(`deleteVideos Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

export {
    addVideos,
    getAllVideos,
    deleteVideos
}