import userModel from "../../models/userModel.js";
import adminModel from "../../models/adminModel.js";
import certificateModel from "../../models/CertificateModel.js";
import { logger } from "../../utils/logger.js";

const getUserStats = async (req, res) => {
    try {
        const { id, role } = req.user;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        let aggregation = [];

        aggregation.push({
            $facet: {
                totalUsers: [{ $count: "count" }],
                thisMonthUsers: [
                    {
                        $match: {
                            createdAt: {
                                $gte: startOfMonth,
                                $lt: startOfNextMonth
                            }
                        }
                    },
                    { $addFields: { createdAtStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
                    { $project: { createdAt: 1, createdAtStr: 1 } },{ $count: "count" }

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
        
        let totalCertificatesIssued = 0;

        if (role === 'superAdmin') {
            totalCertificatesIssued = await certificateModel.countDocuments();
        } else if (role === 'admin') {
            const adminData = await adminModel.findById(id);
            if (!adminData || !adminData.location) {
                return res.status(200).json({
                    status: 200,
                    message: ["No location assigned to this admin"],
                    data: []
                });
            }

            totalCertificatesIssued = await certificateModel.countDocuments({
                locationId: adminData.location
            });
        }

        return res.json({
            totalUsers: result.totalUsers[0]?.count || 0,
            thisMonthUsers: result.thisMonthUsers[0]?.count || 0,
            activeUsers: result.activeUsers[0]?.count || 0,
            topStates: result.topStates.map(item => ({
                state: item._id,
                count: item.count
            })),
            totalCertificatesIssued
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