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
                    mobile: filters?.mobile
                }
            })
        };
        if (filters?.state) {
            aggregation.push({
                $match: {
                    address: filters?.state
                }
            })
        };

        if (filters?.startDate || filters?.endDate) {
            const dateRange = {};

            if (filters.startDate) {
                dateRange.$gte = new Date(new Date(filters.startDate).setHours(0, 0, 0, 0));
            }

            if (filters.endDate) {
                dateRange.$lte = new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
            }

            aggregation.push({
                $match: {
                    createdAt: dateRange
                }
            });
        }

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

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await userModel.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({
                status: 404,
                message: ['User not found.'],
            });
        }

        logger.info(`admin-Deleted user ${id}`);
        return res.status(200).json({
            status: 200,
            message: ['User deleted successfully.'],
        });
    } catch (error) {
        logger.error(`admin-delete user Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    getAllUsers,
    deleteUser
}