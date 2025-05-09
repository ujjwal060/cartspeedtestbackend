import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
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
                userProgress.sections[sectionIndex].videos[videoIndex].watchedDuration = watchedDuration;
                userProgress.sections[sectionIndex].videos[videoIndex].isCompleted = isCompleted;
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
    updateVideoProgress
}