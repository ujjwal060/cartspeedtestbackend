import { logger } from "../../utils/logger.js";
import CertificateModel from '../../models/CertificateModel.js';
import adminModel from '../../models/adminModel.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

const getAllCertificateAdmin = async (req, res) => {
    try {
        const { id, role } = req.user;

        let aggregation = [];

        if (role !== 'superAdmin') {
            const adminData = await adminModel.findById(id);
            if (!adminData || !adminData.location) {
                return res.status(200).json({
                    status: 200,
                    message: ["No location assigned to this admin"],
                    data: []
                });
            }

            aggregation.push({
                $match: {
                    locationId: new ObjectId(adminData.location)
                }
            });
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
        })

        aggregation.push({
            $unwind: {
                path: '$userData',
                preserveNullAndEmptyArrays: true
            }
        })

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

        const result = await CertificateModel.aggregate(aggregation);

        return res.status(200).json({
            status: 200,
            message: ["Certificates fetched successfully"],
            data: result
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
