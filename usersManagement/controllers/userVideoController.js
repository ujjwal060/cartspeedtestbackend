import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import LocationVideo from '../../models/videosModel.js';
import location from '../../models/locationModel.js';
import UserLocation from '../../models/userLocationMap.js';
import UserVideoProgress from '../../models/UserVideoProgress.js';
import safityVideo from "../../models/saftyVideosModel.js";
import { logger } from '../../utils/logger.js';

const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const parseDurationToSeconds = (duration) => {
    if (typeof duration === 'number') return duration;

    if (duration.includes('h') && duration.includes('m')) {
        const [hours, minutes] = duration.split('h').map(part =>
            parseInt(part.replace(/[^0-9]/g, '')) || 0
        );
        return (hours * 3600) + (minutes * 60);
    }

    if (duration.includes('m') && duration.includes('s')) {
        const [minutes, seconds] = duration.split('m').map(part =>
            parseInt(part.replace(/[^0-9]/g, '')) || 0
        );
        return (minutes * 60) + seconds;
    }

    return 0;
};

const getVideos = async (req, res) => {
    try {
        const MAX_DISTANCE_MI = 50;
        const METERS_PER_MILE = 1609.34;
        const userId = req.user.userId;
        const userCurrentLocation = await UserLocation.findOne({ userId, isCurrent: true });

        if (!userCurrentLocation) {
            return res.status(404).json({ message: ['Current location not found for user'] });
        }

        const coordinates = userCurrentLocation.coordinates.coordinates;

        const nearbyLocations = await location.find({
            coordinates: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: coordinates
                    },
                    $maxDistance: MAX_DISTANCE_MI * METERS_PER_MILE,
                }
            }
        });

        if (!nearbyLocations.length) {
            return res.status(404).json({ message: ['No nearby locations found'] });
        }

        const locationIds = nearbyLocations.map(loc => loc._id);
        const aggregation = await getVideoAggregation(locationIds, userId);
        const locationVideos = await LocationVideo.aggregate(aggregation);

        const formattedVideos = locationVideos.map(video => {
            const sectionsWithDuration = video.sections.map(section => {
                const sectionDuration = section.videos.reduce((total, video) => {
                    return total + parseDurationToSeconds(video.durationTime);
                }, 0);

                return {
                    ...section,
                    durationTime: formatDuration(sectionDuration)
                };
            });

            return {
                ...video,
                totalDuration: formatDuration(video.totalDuration),
                sections: sectionsWithDuration
            };
        });

        return res.status(200).json({
            status: 200,
            message: ["video fetched successfully"],
            data: formattedVideos
        });
    } catch (error) {
        logger.error("user-getVideos error", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const updateVideoProgress = async (req, res) => {
    try {
        let { userId, locationId, sectionId, videoId, watchedDuration } = req.body;

        locationId = new ObjectId(locationId);
        sectionId = new ObjectId(sectionId);
        videoId = new ObjectId(videoId);

        const locationVideo = await LocationVideo.findOne({ location: locationId });

        if (!locationVideo) {
            logger.error('LocationVideo not found', { userId, locationId, sectionId, videoId });
            return res.status(404).json({ status: 404, message: ['LocationVideo not found'] });
        }

        const section = locationVideo.sections.find(sec => sec._id.equals(sectionId));
        if (!section) {
            logger.error('Section not found', { userId, locationId, sectionId, videoId });
            return res.status(404).json({ status: 404, message: ['Section not found'] });
        }

        const video = section.videos.find(v => v._id.equals(videoId));
        if (!video) {
            logger.error('Video not found', { userId, locationId, sectionId, videoId });
            return res.status(404).json({ status: 404, message: ['Video not found'] });
        }

        const minutes = Math.floor(watchedDuration / 60);
        const seconds = watchedDuration % 60;
        const formattedDuration = `${minutes}m ${seconds}s`;
        const isCompleted = watchedDuration === video.durationTime;

        let userProgress = await UserVideoProgress.findOne({ userId, locationId });

        if (!userProgress) {
            userProgress = new UserVideoProgress({
                userId,
                locationId,
                sections: []
            });
        }

        let sectionIndex = userProgress.sections.findIndex(sec => sec.sectionId.equals(sectionId));

        if (sectionIndex === -1) {
            userProgress.sections.push({
                sectionId,
                videos: [{
                    videoId,
                    watchedDuration: watchedDuration,
                    isCompleted
                }],
                isSectionCompleted: false
            });
        } else {
            let videoIndex = userProgress.sections[sectionIndex].videos.findIndex(v => v.videoId.equals(videoId));

            if (videoIndex === -1) {
                userProgress.sections[sectionIndex].videos.push({
                    videoId,
                    watchedDuration: watchedDuration,
                    isCompleted
                });
            } else {
                const existingVideoProgress = userProgress.sections[sectionIndex].videos[videoIndex];

                if (!existingVideoProgress.isCompleted) {
                    existingVideoProgress.watchedDuration = watchedDuration;

                    if (watchedDuration === video.durationTime) {
                        existingVideoProgress.isCompleted = true;
                    }
                }
            }
            const totalVideosInSection = section.videos.length;
            const completedVideos = userProgress.sections[sectionIndex].videos.filter(v => v.isCompleted).length;
            userProgress.sections[sectionIndex].isSectionCompleted = completedVideos === totalVideosInSection;
        }

        await userProgress.save();

        return res.status(200).json({
            status: 200,
            message: ['Video progress updated successfully']
        });
    } catch (error) {
        logger.error("video-progress-update error", { error: error.message, stack: error.stack });
        return res.status(500).json({
            status: 500,
            message: [error.message]
        });
    }
};

const getVideoAggregation = async (locationIds, userId) => {
    let aggregation = [];

    aggregation.push({
        $match: {
            location: { $in: locationIds.map(id => new ObjectId(id)) },
        }
    });

    aggregation.push({
        $group: {
            _id: "$location",
            totalVideos: {
                $sum: {
                    $reduce: {
                        input: "$sections",
                        initialValue: 0,
                        in: { $add: ["$$value", { $size: "$$this.videos" }] }
                    }
                }
            },
            totalDuration: {
                $sum: {
                    $reduce: {
                        input: "$sections",
                        initialValue: 0,
                        in: {
                            $add: [
                                "$$value",
                                {
                                    $reduce: {
                                        input: "$$this.videos",
                                        initialValue: 0,
                                        in: {
                                            $add: [
                                                "$$value",
                                                {
                                                    $let: {
                                                        vars: {
                                                            duration: "$$this.durationTime"
                                                        },
                                                        in: {
                                                            $cond: {
                                                                if: { $regexMatch: { input: "$$duration", regex: /^\d+m\s*\d+s$/ } },
                                                                then: {
                                                                    $add: [
                                                                        {
                                                                            $multiply: [
                                                                                {
                                                                                    $toInt: {
                                                                                        $trim: {
                                                                                            input: {
                                                                                                $substr: [
                                                                                                    "$$duration",
                                                                                                    0,
                                                                                                    { $indexOfCP: ["$$duration", "m"] }
                                                                                                ]
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                },
                                                                                60
                                                                            ]
                                                                        },
                                                                        {
                                                                            $toInt: {
                                                                                $trim: {
                                                                                    input: {
                                                                                        $substr: [
                                                                                            "$$duration",
                                                                                            { $add: [{ $indexOfCP: ["$$duration", "m"] }, 1] },
                                                                                            { $subtract: [{ $indexOfCP: ["$$duration", "s"] }, { $add: [{ $indexOfCP: ["$$duration", "m"] }, 1] }] }
                                                                                        ]
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    ]
                                                                },
                                                                else: { $toInt: "$$duration" }
                                                            }
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            sections: { $first: "$sections" }
        }
    });

    aggregation.push({
        $lookup: {
            from: "locations",
            let: { locationId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$_id", "$$locationId"] }
                    }
                }
            ],
            as: "locationDetails",
        }
    });

    aggregation.push({
        $unwind: {
            path: "$locationDetails",
            preserveNullAndEmptyArrays: true
        }
    });

    aggregation.push({
        $unwind: "$sections"
    });

    aggregation.push({
        $lookup: {
            from: "uservideoprogresses",
            let: {
                sectionId: "$sections._id",
                locationId: "$_id",
                userId: { $toObjectId: userId }
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$userId", "$$userId"] },
                                { $eq: ["$locationId", "$$locationId"] }
                            ]
                        }
                    }
                },
                { $unwind: "$sections" },
                {
                    $match: {
                        $expr: {
                            $eq: ["$sections.sectionId", "$$sectionId"]
                        }
                    }
                },
                {
                    $project: {
                        "sections.videos": 1,
                        "sections.isSectionCompleted": 1
                    }
                }
            ],
            as: "userProgress"
        }
    });

    aggregation.push({
        $unwind: {
            path: "$userProgress",
            preserveNullAndEmptyArrays: true,
        }
    });

    aggregation.push({
        $group: {
            _id: "$_id",
            location: { $first: "$locationDetails.name" },
            locationId: { $first: "$_id" },
            totalVideos: { $first: "$totalVideos" },
            totalDuration: { $first: "$totalDuration" },
            sections: {
                $push: {
                    _id: "$sections._id",
                    sectionNumber: "$sections.sectionNumber",
                    title: "$sections.title",
                    durationTime: "$sections.durationTime",
                    isSectionCompleted: {
                        $ifNull: ["$userProgress.sections.isSectionCompleted", false]
                    },
                    videos: {
                        $map: {
                            input: "$sections.videos",
                            as: "video",
                            in: {
                                $mergeObjects: [
                                    "$$video",
                                    {
                                        $let: {
                                            vars: {
                                                videoProgress: {
                                                    $arrayElemAt: [
                                                        {
                                                            $filter: {
                                                                input: "$userProgress.sections.videos",
                                                                as: "progress",
                                                                cond: {
                                                                    $eq: ["$$progress.videoId", "$$video._id"]
                                                                }
                                                            }
                                                        },
                                                        0
                                                    ]
                                                }
                                            },
                                            in: {
                                                watchedDuration: { $ifNull: ["$$videoProgress.watchedDuration", "0"] },
                                                isCompleted: { $ifNull: ["$$videoProgress.isCompleted", false] }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    });

    return aggregation;
};

const getSaftyVideo = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userLoc = await UserLocation.findOne({
            userId: new ObjectId(userId),
            isCurrent: true
        });

        if (!userLoc) {
            return res.status(404).json({
                status: 404,
                message: ['Current user location not found']
            });
        }

        const userCoordinates = userLoc.coordinates.coordinates;
        logger.info('User Coordinates:', userCoordinates);

        const nearbyLocations = await location.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: userCoordinates },
                    distanceField: "distance",
                    spherical: true,
                    maxDistance: 80467.2,
                    distanceMultiplier: 0.001
                }
            }
        ]);

        if (nearbyLocations.length === 0) {
            return res.status(404).json({
                status: 404,
                message: ['No locations found within 50 miles radius']
            });
        }

        const locationIds = nearbyLocations.map(loc => loc._id);
        let aggregation = await saftyVideoAggregation(locationIds, nearbyLocations);

        const videos = await safityVideo.aggregate(aggregation);
        logger.info('Safety videos found:', videos.length);

        if (videos.length === 0) {
            return res.status(404).json({
                status: 404,
                message: ['No safety videos found for nearby locations']
            });
        }

        return res.json({
            status: 200,
            message: ['Successfully found safety videos for nearby locations'],
            data: videos
        });

    } catch (error) {
        logger.error('Error in getSaftyVideo:', error);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const saftyVideoAggregation = async (locationIds, nearbyLocations) => {
    let aggregation = [];

    aggregation.push({
        $match: {
            locationId: { $in: locationIds },
            isActive: true
        }
    });

    aggregation.push({
        $lookup: {
            from: 'locations',
            localField: 'locationId',
            foreignField: '_id',
            as: 'location'
        }
    });

    aggregation.push({
        $unwind: '$location'
    });

    aggregation.push({
        $addFields: {
            'location.distance': {
                $let: {
                    vars: {
                        locId: '$locationId'
                    },
                    in: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: nearbyLocations,
                                    as: 'nearLoc',
                                    in: {
                                        $cond: {
                                            if: { $eq: ['$$nearLoc._id', '$$locId'] },
                                            then: '$$nearLoc.distance',
                                            else: null
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            }
        }
    });

    aggregation.push({
        $group: {
            _id: '$locationId',
            video: { $first: '$$ROOT' }
        }
    });

    aggregation.push({
        $replaceRoot: { newRoot: '$video' }
    });

    aggregation.push({
        $project: {
            _id: 1,
            title: 1,
            description: 1,
            durationTime: 1,
            url: 1,
            distance: '$location.distance'
        }
    });

    aggregation.push({
        $sort: { distance: 1 }
    });

    return aggregation;
}

export {
    getVideos,
    updateVideoProgress,
    getSaftyVideo
}