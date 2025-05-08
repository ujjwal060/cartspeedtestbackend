import LocationVideo from '../../models/videosModel.js';
import location from '../../models/locationModel.js';
import UserLocation from '../../models/userLocationMap.js';
import UserVideoProgress from '../../models/UserVideoProgress.js';
import { logger } from '../../utils/logger.js';

const getVideos = async (req, res) => {
    try {
        const MAX_DISTANCE_MI = 50;
        const METERS_PER_MILE = 1609.34;
        const userId = req.user.userId;
        const userCurrentLocation = await UserLocation.findOne({ userId, isCurrent: true });

        if (!userCurrentLocation) {
            return res.status(404).json({ message: 'Current location not found for user' });
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
            return res.status(404).json({ message: 'No nearby locations found' });
        }

        const locationIds = nearbyLocations.map(loc => loc._id);
        const aggregation = await getVideoAggregation(locationIds);
        const locationVideos = await LocationVideo.aggregate(aggregation);

        return res.status(200).json({
            status: 200,
            message: ["video fetched successfully"],
            data: locationVideos
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
        const userId = req.user._id;
        const { videoId, sectionId, locationId, lastPlayedTime, isCompleted } = req.body;
        if (!videoId || !sectionId || !locationId) {
            return res.status(400).json({ message: 'videoId, sectionId, and locationId are required' });
        }

        const progress = await UserVideoProgress.findOneAndUpdate(
            { userId, videoId, sectionId, locationId },
            {
                $set: {
                    lastPlayedTime,
                    isCompleted
                }
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            status: 200,
            message: ['Progress updated'],
            data: progress
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message]
        });
    }
}

const getVideoAggregation = async (locationIds) => {
    let aggregation = [];
    aggregation.push({
        $match: {
            location: { $in: locationIds },
        }
    })

    aggregation.push({
        $unwind: "$sections",
    })

    aggregation.push({
        $addFields: {
            "sections.locationId": "$location",
        }
    })
    aggregation.push({
        $lookup: {
            from: "locations",
            localField: "sections.locationId",
            foreignField: "_id",
            as: "locationDetails",
        }
    })
    aggregation.push({
        $unwind: "$locationDetails",
    })
    aggregation.push({
        $project: {
            _id: "$sections._id",
            sectionNumber: "$sections.sectionNumber",
            title: "$sections.title",
            durationTime: "$sections.durationTime",
            videos: "$sections.videos",
            location: "$locationDetails.name",
            locationId: "$locationDetails._id"
        },
    })
    return aggregation;
}

export {
    getVideos,
}