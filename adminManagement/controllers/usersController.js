import userModel from "../../models/userModel.js";
import { logger } from "../../utils/logger.js";

const getAllUsers = async (req, res) => {
    try {
        const { filters, sortField, sortBy, offset, limit } = req.body;
        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);
        let aggregation = [];

        if (filters?.name) {
            aggregation.push({
                $match: {
                    name: {
                        $regex: filters?.name,
                        $options: 'i'
                    }
                }
            })
        };

        if (filters?.email) {
            aggregation.push({
                $match: {
                    email: filters?.email
                }
            })
        };

        if (filters?.mobile) {
            aggregation.push({
                $match: {
                    email: filters?.email
                }
            })
        };
        if (filters?.state) {
            aggregation.push({
                $match: {
                    state: filters?.state
                }
            })
        };

        if (sortField) {
            aggregation.push({
                $sort: {
                    [sortField]: parseInt(sortBy) === 1 ? 1 : -1
                }
            });
        }

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

        const [result] = await userModel.aggregate(aggregation);
        const total = result.totalCount[0]?.count || 0;
        logger.info(`admin-Fetched-users ${result.data.length} users`);

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: result.data,
            total
        });

    } catch (error) {
        logger.error(`admin-getAll users Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export{
    getAllUsers
}