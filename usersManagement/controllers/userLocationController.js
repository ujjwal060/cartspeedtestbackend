import userLocation from '../../models/userLocationMap.js';
import locationModel from '../../models/locationModel.js';
import { logger } from '../../utils/logger.js';

const EARTH_RADIUS_MI = 3963.2;
const MAX_DISTANCE_MI = 50;
const METERS_PER_MILE = 1609.34;

const addOrUpdateUserLocation = async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        const userId = req.user.userId;
        let locationDoc;

        if (!userId || !latitude || !longitude || !name) {
            logger.warn('Missing required fields in location request');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const coordinates = [latitude, longitude];
        const maxDistanceInMeters = MAX_DISTANCE_MI * METERS_PER_MILE;

        logger.info(`Checking nearby location for user: ${userId}`);

        const nearbyLocation = await userLocation.findOne({
            userId,
            coordinates: {
                $nearSphere: {
                    $geometry: { type: "Point", coordinates },
                    $maxDistance: maxDistanceInMeters
                }
            }
        });

        logger.info(`Nearby location found: ${!!nearbyLocation}`);

        await userLocation.updateMany({ userId }, { $set: { isCurrent: false } });
        logger.info(`Reset isCurrent for all locations of user: ${userId}`);

        if (nearbyLocation) {
            logger.info('Updating existing nearby location as current');
            locationDoc = await userLocation.findByIdAndUpdate(
                nearbyLocation._id,
                { $set: { isCurrent: true } },
                { new: true }
            );
        } else {
            logger.info('Creating new location and marking as current');
            locationDoc = await userLocation.create({
                userId,
                name,
                coordinates: {
                    type: "Point",
                    coordinates
                },
                isCurrent: true
            });
        }

        logger.info(`Location updated successfully for user: ${userId}`);

        return res.status(200).json({
            status: 200,
            message: ['Location updated'],
            data: locationDoc
        });

    } catch (error) {
        logger.error(`Error in addOrUpdateUserLocation: ${error.message}`);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const gateLocationGeofence = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userLoc = await userLocation.findOne({ userId, isCurrent: true });
        if (!userLoc || !userLoc.coordinates) {
            return res.status(404).json({
                status: 404,
                message: ['User location not found'],
            });
        }
        const userCoords = userLoc.coordinates.coordinates;

        const matchedLocation = await locationModel.findOne({
            geometry: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: userCoords,
                    },
                },
            },
        });

        if (!matchedLocation) {
            return res.status(404).json({
                status: 404,
                message: ['No matching location found near user coordinates'],
            });
        }

        return res.status(200).json({
            status: 200,
            message: ['Location found'],
            data: matchedLocation,
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    addOrUpdateUserLocation,
    gateLocationGeofence
}
