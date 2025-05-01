import mongoose from "mongoose";
import questionModel from "../../models/questionModel.js"
import LocationVideo from "../../models/videosModel.js";
import adminModel from "../../models/adminModel.js";
import { logger } from "../../utils/logger.js";
import { getVideoDurationInSeconds } from 'get-video-duration';

const addVideos = async (req, res) => {
    try {
        const { title, description, sectionNumber, sectionTitle } = req.body;
        const adminId = req.user.id;
        const url = req.fileLocations[0];

        if (!title || !url || !sectionNumber || !sectionTitle || !adminId) {
            logger.warn('Missing required fields in addVideos');
            return res.status(400).json({
                status: 400,
                message: ['Required fields are missing.'],
            });
        }

        const location = await adminModel.findById(adminId);
        if (!location) {
            return res.status(404).json({
                status: 404,
                message: ['No location found for this admin.'],
            });
        }
        const locationId = location._id;
        const durationTime = await getVideoDuration(url);
        const videoData = {
            title,
            url,
            description,
            durationTime,
            isActive: true,
        };

        let locationVideo = await LocationVideo.findOne({ admin: adminId, location: locationId });
        if (!locationVideo) {
            locationVideo = new LocationVideo({
                admin: adminId,
                location: locationId,
                sections: [],
            });
        }

        await locationVideo.addOrUpdateVideo(parseInt(sectionNumber), videoData, sectionTitle);

        return res.status(201).json({
            status: 201,
            message: ['Video uploaded and added to section successfully.'],
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
        const adminId = req.user.id;
        let aggregation = [];

        aggregation.push({
            $match: {
                admin: new mongoose.Types.ObjectId(adminId),
            }
        });

        aggregation.push({
            $lookup: {
                from: 'locations',
                localField: 'location',
                foreignField: '_id',
                as: 'locationInfo',
            },
        });
        aggregation.push({
            $unwind: {
                path: '$locationInfo',
                preserveNullAndEmptyArrays: true,
            },
        });
        aggregation.push({
            $unwind: {
                path: '$sections',
                preserveNullAndEmptyArrays: false,
            },
        })
        aggregation.push({
            $unwind: {
                path: '$sections.videos',
                preserveNullAndEmptyArrays: false,
            },
        })
        aggregation.push({
            $project: {
                location: '$location',
                locationName: '$locationInfo.name',
                section: '$sections.sectionNumber',
                sectionTitle: '$sections.title',
                sectionDurationTime: '$sections.durationTime',
                video: '$sections.videos',
            },
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

        const [result] = await LocationVideo.aggregate(aggregation);
        const total = result.totalCount[0]?.count || 0;
        logger.info(`Fetched ${result.data.length} videos for user: ${req.user.id}`);

        const formatted = result.data.map(item => ({
            location: item.location,
            locationName: item.locationName,
            section: `section 0${item.section}`,
            sectionTitle: item.sectionTitle,
            video: item.video,
          }));
      
          logger.info(`Fetched ${formatted.length} videos for admin: ${adminId}`);

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: formatted,
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
        await questionModel.deleteMany({ videoId });
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

const videosStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await videoModel.findById(id);
        if (!video) {
            logger.warn(`videosStatus: Video with ID ${id} not found`);
            return res.status(404).json({
                status: 404,
                message: ['Video not found'],
            });
        }

        video.isActive = !video.isActive;
        await video.save();

        logger.info(`videosStatus: Video status updated to ${video.isActive ? 'active' : 'inactive'} for ID ${id}`);

        return res.status(200).json({
            status: 200,
            message: [`Video status updated to ${video.isActive ? 'active' : 'inactive'}`],
            data: video
        });

    } catch (error) {
        logger.error(`videosStatus Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const checkExistingSection = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { sectionNumber } = req.body;
        let aggregation = [];

        if (!adminId || !sectionNumber) {
            logger.warn('checkSectionTitle: Missing adminId or sectionNumber');
            return res.status(400).json({
                status: 400,
                message: ['adminId and sectionNumber are required.'],
            });
        }

        aggregation.push({
            $match: {
                admin: new mongoose.Types.ObjectId(adminId)
            }
        })

        aggregation.push({
            $match: {
                'sections.sectionNumber': parseInt(sectionNumber)
            }
        })
        aggregation.push({
            $project: {
                _id: 0,
                title: '$sections.title'
            }
        })

        const [result] = await LocationVideo.aggregate(aggregation);
        const title = result?.title || '';

        logger.info(`checkExistingSection: Found section title "${title}" for admin ${adminId}`);

        return res.status(200).json({
            status: 200,
            message: ['Section title fetched successfully.'],
            data: { title }
        });
    } catch (error) {
        logger.error(`checkSectionTitle Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getVideoDuration = async (url) => {
    const duration = await getVideoDurationInSeconds(url);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}m ${seconds}s`;
};

export {
    addVideos,
    getAllVideos,
    deleteVideos,
    videosStatus,
    checkExistingSection
}