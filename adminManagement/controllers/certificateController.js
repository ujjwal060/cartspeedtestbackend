import { logger } from "../../utils/logger.js";
import CertificateModel from '../../models/CertificateModel.js';
import adminModel from '../../models/adminModel.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

const getAllCertificateAdmin = async (req, res) => {
    try {
        const adminId = req.user.id;
        const role = req.user.role;
        const {
            filters,
            offset,
            limit,
            sortBy,
            sortField
        } = req.body;

        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);

        const {
            userName,
            locationName,
            certificateNumber,
            status,
            startDate,
            endDate,
        } = filters;

        let aggregation = [];
        let matchAdminStage = [];

        if (role === 'admin') {
            const adminData = await adminModel.findById(adminId);
            if (!adminData || !adminData.location) {
                return res.status(200).json({
                    status: 200,
                    message: ["No location assigned to this admin"],
                    data: []
                });
            }

            matchAdminStage = {
                locationId: new ObjectId(adminData.location)
            };
        }

        const dateMatch = {};
        if (startDate) dateMatch.issueDate = { ...dateMatch.issueDate, $gte: new Date(startDate) };
        if (endDate) dateMatch.issueDate = { ...dateMatch.issueDate, $lte: new Date(endDate) };

        const combinedMatch = { ...matchAdminStage, ...dateMatch };
        if (Object.keys(combinedMatch).length > 0) {
            aggregation.push({ $match: combinedMatch });
        }

        aggregation.push({
            $lookup: {
                from: 'locations',
                localField: 'locationId',
                foreignField: '_id',
                as: 'locationData'
            }
        });

        aggregation.push({ $unwind: "$locationData" });
        if (locationName) {
            aggregation.push({
                $match: {
                    'locationData.name': { $regex: locationName, $options: 'i' }
                }
            });
        }

        aggregation.push({
            $lookup: {
                from: 'admins',
                localField: 'locationData.admin',
                foreignField: '_id',
                as: 'adminData'
            }
        });

        aggregation.push({
            $unwind: {
                path: '$adminData',
                preserveNullAndEmptyArrays: true
            }
        });

        aggregation.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userData'
            }
        });

        aggregation.push({
            $unwind: {
                path: '$userData',
                preserveNullAndEmptyArrays: true
            }
        });

        if (userName) {
            aggregation.push({
                $match: {
                    'userData.name': { $regex: userName, $options: 'i' }
                }
            });
        }

        if (certificateNumber) {
            aggregation.push({
                $match: { certificateNumber }
            });
        }

        if (status) {
            aggregation.push({
                $match: { status }
            });
        }

        aggregation.push({
            $project: {
                _id: 1,
                certificateNumber: 1,
                certificateName: 1,
                issueDate: 1,
                validUntil: 1,
                certificateUrl: 1,
                email: 1,
                status: 1,
                userName: '$userData.name',
                locationId: 1,
                locationName: '$locationData.name',
                adminName: '$adminData.name'
            }
        });

        aggregation.push({ $sort: { [sortField]: sortBy } });

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

        const [result] = await CertificateModel.aggregate(aggregation);
        const total = result.totalCount[0]?.count || 0;

        const statsMatch = [];
        if (matchAdminStage && Object.keys(matchAdminStage).length > 0) {
            statsMatch.push({ $match: combinedMatch });

        }

        statsMatch.push({
            $group: {
                _id: null,
                totalActive: {
                    $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
                },
                totalExpired: {
                    $sum: { $cond: [{ $eq: ["$status", "Expired"] }, 1, 0] }
                }
            }
        })

        statsMatch.push({
            $project: {
                totalActive: 1,
                totalExpired: 1,
                totalCertificate: { $add: ["$totalActive", "$totalExpired"] }
            }
        })

        const statsAggregation = await CertificateModel.aggregate(statsMatch);

        const stats = statsAggregation[0] || {};
        const totalActive = stats.totalActive || 0;
        const totalExpired = stats.totalExpired || 0;
        const totalCertificate = stats.totalCertificate || 0;

        return res.status(200).json({
            status: 200,
            message: ["Certificates fetched successfully"],
            data: result.data,
            total,
            totalActive,
            totalExpired,
            totalCertificate
        });

    } catch (error) {
        logger.error("Error in getAllCertificateAdmin", error);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

export { getAllCertificateAdmin };
