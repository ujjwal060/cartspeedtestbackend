import videosModel from '../../models/videosModel.js';
import { logger } from '../../utils/logger.js';

const getVideos = async (req, res) => {
    try {
        const { offset, limit } = req.body;
        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);
        let aggregation = [];

        aggregation.push({
            $match:{
                isActive:true
            }
        });
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
        });

        const [result] = await videosModel.aggregate(aggregation);
        const total = result.totalCount[0]?.count || 0;
        logger.info(`User fetched ${result.data.length} videos, userId: ${req.user.userId}`);

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: result.data,
            total
        });

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