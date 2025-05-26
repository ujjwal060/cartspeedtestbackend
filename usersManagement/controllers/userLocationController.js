import userLocation from '../../models/userLocationMap.js';
import { logger } from '../../utils/logger.js';

const EARTH_RADIUS_MI = 3963.2;
const MAX_DISTANCE_MI = 50;
const METERS_PER_MILE = 1609.34;
const ACCESSIBLE_RADIUS_MI = 80;

const addOrUpdateUserLocation = async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        const userId = req.user.userId;
        let locationDoc;

        if (!userId || !latitude || !longitude || !name) {
            logger.warn('Missing required fields in location request');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const coordinates = [latitude,longitude];
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

const getAccessibleArea = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userCurrentLocation = await userLocation.findOne({ userId, isCurrent: true });

        if (!userCurrentLocation) {
            logger.warn('Current location not found for user');
            return res.status(404).json({ 
                status: 404,
                message: ['Current location not found for user'] 
            });
        }

        const [longitude, latitude] = userCurrentLocation.coordinates.coordinates;
        
        // Generate points for the polygon (32 points for a smooth circle)
        const numPoints = 32;
        const points = [];
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * 360) / numPoints;
            const point = calculatePointFromCenter(latitude, longitude, ACCESSIBLE_RADIUS_MI, angle);
            points.push(point);
        }

        // Close the polygon by adding the first point again
        points.push(points[0]);

        const polygon = {
            type: "Feature",
            properties: {
                name: userCurrentLocation.name,
                radius: ACCESSIBLE_RADIUS_MI
            },
            geometry: {
                type: "Polygon",
                coordinates: [points]
            }
        };

        return res.status(200).json({
            status: 200,
            message: ['Accessible area polygon generated successfully'],
            data: polygon
        });

    } catch (error) {
        logger.error(`Error in getAccessibleArea: ${error.message}`);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

// Helper function to calculate a point on the circle given center, radius and angle
const calculatePointFromCenter = (lat, lon, radiusMiles, angleDegrees) => {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const latRadians = (lat * Math.PI) / 180;
    const lonRadians = (lon * Math.PI) / 180;

    const angularDistance = radiusMiles / EARTH_RADIUS_MI;

    const newLat = Math.asin(
        Math.sin(latRadians) * Math.cos(angularDistance) +
        Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(angleRadians)
    );

    const newLon = lonRadians + Math.atan2(
        Math.sin(angleRadians) * Math.sin(angularDistance) * Math.cos(latRadians),
        Math.cos(angularDistance) - Math.sin(latRadians) * Math.sin(newLat)
    );

    return [
        (newLon * 180) / Math.PI,
        (newLat * 180) / Math.PI
    ];
};

export {
    addOrUpdateUserLocation,
    getAccessibleArea
};
