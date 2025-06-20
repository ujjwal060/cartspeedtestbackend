import userLocationModel from '../models/userLocationMap.js';
import adminLocationModel from '../models/locationModel.js';
import adminModel from '../models/adminModel.js';

const checkIsAdminActive = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const userLoc = await userLocationModel.findOne({ userId, isCurrent: true });
        if (!userLoc || !userLoc.coordinates) {
            return res.status(404).json({
                status: 404,
                message: ['User location not found'],
            });
        }
        const userCoords = userLoc.coordinates.coordinates;

        const matchedLocation = await adminLocationModel.findOne({
            geometry: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: userCoords,
                    },
                },
            },
        });

        const admin = await adminModel.findOne({
            location: matchedLocation._id,
            isActive: true,
        });

        if (!admin) {
            return res.status(403).json({
                status: 403,
                message: ['This location is currently not active for driving'],
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    checkIsAdminActive
}