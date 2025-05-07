import LocationVideo from '../../models/videosModel.js';
import location from '../../models/locationModel.js';
import { logger } from '../../utils/logger.js';

const getVideos = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const nearbyLocations = await location.find({
            coordinates: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [81.0076, 26.8506],
                    },
                    $maxDistance: 80467,
                }
            }
        });

        if (!nearbyLocations.length) {
            return res.status(404).json({ message: 'No nearby locations found' });
        }

        const locationIds = nearbyLocations.map(loc => loc._id);

        const locationVideos = await LocationVideo.find({
            location: { $in: locationIds },
        });

        res.json(locationVideos);
    } catch (error) {
        logger.error("user-getVideos error", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    getVideos,
}