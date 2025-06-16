import userModel from "../../models/userModel.js";
import { logger } from "../../utils/logger.js";

const getUserStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        let aggregation = [];

        aggregation.push({
            $facet: {
                totalUsers: [{ $count: "count" }],
                thisMonthUsers: [
                    { $match: { createdAt: { $gte: startOfMonth } } },
                    { $count: "count" }
                ],
                activeUsers: [
                    { $match: { isActive: true } },
                    { $count: "count" }
                ],
                topStates: [
                    {
                        $group: {
                            _id: "$address",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ]
            }
        });

        const [result] = await userModel.aggregate(aggregation);
        return res.json({
            totalUsers: result.totalUsers[0]?.count || 0,
            thisMonthUsers: result.thisMonthUsers[0]?.count || 0,
            activeUsers: result.activeUsers[0]?.count || 0,
            topStates: result.topStates.map(item => ({
                state: item._id,
                count: item.count
            }))
        });

    } catch (error) {
        logger.error(`admin-dashboard data Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    getUserStats
}