import userModel from "../../models/userModel.js";
import userlocation from "../../models/userLocationMap.js";
import userTestAttempt from "../../models/userTestModel.js";
import certificate from "../../models/CertificateModel.js";
import AdminModel from "../../models/adminModel.js";
import { logger } from "../../utils/logger.js";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const getAllUsers = async (req, res) => {
  try {
    const { filters, sortField, sortBy, offset, limit } = req.body;
    const parsedOffset = parseInt(offset) || 0;
    const parsedLimit = parseInt(limit) || 10;

    const role = req.user.role;
    const userId = req.user.id;

    let aggregation = [];

    if (role === "admin") {
      const adminData = await AdminModel.findById(userId);
      if (!adminData || !adminData.location) {
        return res.status(200).json({
          status: 200,
          message: ["No location assigned to this admin"],
          data: [],
          total: 0
        });
      }

      aggregation.push({
        $lookup: {
          from: "certificates",
          localField: "_id",
          foreignField: "userId",
          as: "certificates"
        }
      });

      aggregation.push({ $unwind: "$certificates" });

      aggregation.push({
        $match: {
          "certificates.locationId": new ObjectId(adminData.location)
        }
      });
    }

    if (filters?.name) {
      aggregation.push({
        $match: {
          name: { $regex: filters?.name, $options: "i" }
        }
      });
    }

    if (filters?.email) {
      aggregation.push({ $match: { email: filters?.email } });
    }

    if (filters?.mobile) {
      aggregation.push({ $match: { mobile: filters?.mobile } });
    }

    if (filters?.address) {
      const escapedAddress = filters.address.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      aggregation.push({
        $match: {
          address: { $regex: escapedAddress, $options: "i" }
        }
      });
    }

    if (filters?.startDate || filters?.endDate) {
      const dateRange = {};
      if (filters.startDate) {
        dateRange.$gte = new Date(new Date(filters.startDate).setHours(0, 0, 0, 0));
      }
      if (filters.endDate) {
        dateRange.$lte = new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
      }
      aggregation.push({ $match: { createdAt: dateRange } });
    }

    if (sortField) {
      aggregation.push({
        $sort: { [sortField]: parseInt(sortBy) === 1 ? 1 : -1 }
      });
    } else {
      aggregation.push({ $sort: { createdAt: -1 } });
    }

    aggregation.push({
      $project: {
        _id: 0,
        name: 1,
        email: 1,
        mobile: "$mobile",
        address: 1,
        date: "$createdAt"
      }
    });

    aggregation.push({
      $facet: {
        data: [{ $skip: parsedOffset }, { $limit: parsedLimit }],
        totalCount: [{ $count: "count" }]
      }
    });

    const [result] = await userModel.aggregate(aggregation);
    const total = result.totalCount[0]?.count || 0;

    logger.info(`admin-Fetched-users ${result.data.length} users`);

    return res.status(200).json({
      status: 200,
      message: ["Users fetched successfully."],
      data: result.data,
      total
    });
  } catch (error) {
    logger.error(`admin-getAll users Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message]
    });
  }
};


const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: ['User not found.'],
            });
        }

        await Promise.all([
            userlocation.deleteMany({ userId: id }),
            userTestAttempt.deleteMany({ userId: id }),
            certificate.deleteMany({ userId: id }),
        ]);

        await userModel.findByIdAndDelete(id);

        logger.info(`admin-Deleted user ${id} and all related data`);
        return res.status(200).json({
            status: 200,
            message: ['User and all related data deleted successfully.'],
        });
    } catch (error) {
        logger.error(`admin-delete user Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const findUserByAdminLocation = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await AdminModel.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                status: 404,
                message: ["Admin not found"],
            });
        }

        const locationId = admin.location;

        const certificates = await certificate.aggregate([
            {
                $match: {
                    locationId: locationId,
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$issueDate" },
                        month: { $month: "$issueDate" },
                    },
                    totalCertificates: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);

        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        if (!certificates.length) {
            return res.status(200).json({ status: 200, data: [] });
        }

        const years = certificates.map(c => c._id.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        let filledData = [];

        for (let year = minYear; year <= maxYear; year++) {
            const lastMonth = (year === currentYear) ? currentMonth : 12;

            for (let month = 1; month <= lastMonth; month++) {
                const found = certificates.find(
                    c => c._id.year === year && c._id.month === month
                );
                filledData.push({
                    label: `${monthNames[month - 1]}`,
                    year,
                    month,
                    totalCertificates: found ? found.totalCertificates : 0
                });
            }
        }

        return res.status(200).json({
            status: 200,
            data: filledData
        });

    } catch (error) {
        logger.error(`admin-findUserByAdminLocation Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const getLatestUsers = async (req, res) => {
    try {
        const latestUsers = await userModel
            .find({}, { name: 1, address: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .limit(5);

        const totalUsers = await userModel.countDocuments();

        return res.status(200).json({
            status: 200,
            message: ['Latest users fetched successfully.'],
            data: latestUsers,
            total: totalUsers
        });

    } catch (error) {
        logger.error(`admin-getLatestUsers Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

export {
    getAllUsers,
    deleteUser,
    findUserByAdminLocation,
    getLatestUsers
}