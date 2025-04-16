import mongoose from "mongoose";
import videoModel from "../models/videosModel.js";
import { logger } from "../../utils/logger.js";

const addVideos = async (req, res) => {
    try {
        const { title, description, locationState } = req.body;
        const uploadedBy = req.user.id;
        const url = req.fileLocations[0];

        if (!title || !url || !locationState || !uploadedBy) {
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
        const { filters,sortField,sortBy,offset,limit } = req.body;
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
                    views:filters?.views
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
                url:1,
                views:1,
                uploadedBy: {
                    name: 1,
                    role: 1
                },
                uploadDate:1
            }
        });

        aggregation.push({
            $sort: {
                [sortField]: parseInt(sortBy) === 1 ? 1 : -1
            }
        });

        // aggregation.push({ $skip: parsedOffset });
        // aggregation.push({ $limit: parsedLimit });

        aggregation.push({
            $facet: {
                data: [
                    { $sort: { [sortField]: parseInt(sortBy) === 1 ? 1 : -1 } },
                    { $skip: parsedOffset },
                    { $limit: parsedLimit }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        })

        // const result = await videoModel.aggregate(aggregation);
        const [result] = await videoModel.aggregate(aggregation);

        const total = result.totalCount[0]?.count || 0;

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: result.data,
            total
        });

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: result
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
    addVideos,
    getAllVideos
}