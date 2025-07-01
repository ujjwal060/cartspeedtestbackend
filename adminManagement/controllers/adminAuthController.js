import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import adminModel from '../../models/adminModel.js'
import { logger } from "../../utils/logger.js";
import { hashPassword } from '../../utils/passwordUtils.js';
import { generateOTP, sendEmail } from '../../utils/otpUtils.js';
import { emailTamplates } from "../../utils/emailTemplate.js";
import locationModel from "../../models/locationModel.js";
import { loadConfig } from "../../config/loadConfig.js";


const adminRegister = async (req, res) => {
    try {
        const { name, email, locationName, zipCode, geoJsonData, role, password, mobile } = req.body;
        logger.info("Incoming request for admin registration", { name, email, role });

        if (role === 'superadmin') {
            const existingSuperAdmin = await adminModel.findOne({ role: 'superadmin' });
            if (existingSuperAdmin) {
                logger.warn("Attempt to create superadmin when one already exists", { email });
                return res.status(400).json({
                    status: 400,
                    message: ['Superadmin already exists'],
                });
            }
        }

        if (role === 'admin') {
            const existingAdmin = await adminModel.findOne({ email });
            if (existingAdmin) {
                logger.warn("Admin with the same email already exists", { email });
                return res.status(400).json({
                    status: 400,
                    message: ['Admin with this email already exists'],
                });
            }
        }

        const result = await checkAndSaveLocation({ locationName, zipCode, geoJsonData });
        if (!result.success) {
            logger.warn("Location validation failed", { message: result.message });
            return res.status(result.status).json({
                status: result.status,
                message: result.message
            });
        }

        const locationId = result.locationId;

        const hashedPassword = await hashPassword(password);
        const newAdmin = new adminModel({
            name,
            email,
            location: locationId,
            password: hashedPassword,
            role,
            mobile
        });

        await newAdmin.save();
        logger.info("New admin created successfully", { name, email, role });
        const { subject, body } = emailTamplates.sendAdminCurd(name, email, password);
        const emailSent = await sendEmail({ email, subject, body });
        if (!emailSent.success) {
            logger.error("Failed to send email to new admin", { email, error: emailSent.message });
            return res.status(500).json({
                status: 500,
                message: emailSent.message,
            });
        }

        logger.info("Email sent to new admin successfully", { email });
        res.status(201).json({
            status: 201,
            message: ["Register Successfully!"]
        });
    } catch (error) {
        logger.error("Error in admin registration", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const login = async (req, res) => {
    try {
        const config = await loadConfig();
        const { email, password } = req.body;

        if (!email || !password) {
            logger.warn(`Admin login failed - Missing credentials. Email: ${email}`);
            return res.status(400).json({
                status: 400,
                message: ['Email and password are required'],
            });
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            logger.warn(`Admin login failed - Invalid email: ${email}`);
            return res.status(401).json({
                status: 401,
                message: ['Invalid email'],
            });
        }

        if (admin.role === 'admin' && admin.isActive === false) {
            logger.warn(`Admin login blocked - Inactive admin. Email: ${email}`);
            return res.status(403).json({
                status: 403,
                isActive: false,
                message: ['You have been blocked by the super admin. Please contact the super admin.'],
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            logger.warn(`Admin login failed - Invalid password. Email: ${email}`);
            return res.status(401).json({
                status: 401,
                message: ['Invalid password'],
            });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );
        logger.info(`Admin login successful - ID: ${admin._id}, Email: ${email}`);

        return res.status(200).json({
            status: 200,
            message: ["Login successful"],
            data: {
                token,
                refreshToken,
                id: admin._id,
                role: admin.role
            }
        });

    } catch (error) {
        logger.error(`Admin login error - ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const forgatePassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            logger.warn('Admin forgot password failed - Email is required');
            return res.status(400).json({
                status: 400,
                message: ['Email is required'],
            });
        }

        const admin = await adminModel.findOne({ email });

        if (!admin) {
            logger.warn(`Admin forgot password failed - Email not found: ${email}`);
            return res.status(404).json({
                status: 404,
                message: ['Admin with this email does not exist'],
            });
        }

        const otp = generateOTP();
        admin.otp = otp;
        admin.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        await admin.save();

        const { subject, body } = emailTamplates.otpVerification(admin.name, otp);
        const otpSent = await sendEmail({ email, subject, body });

        if (!otpSent.success) {
            logger.error("Admin Failed to send OTP", { email, error: otpSent.message });
            return res.status(500).json({
                status: 500,
                message: otpSent.message,
            });
        }

        logger.info("Admin OTP sent successfully", { email });

        return res.status(200).json({
            status: 200,
            message: ["OTP has been sent to your Email."],
        });
    } catch (error) {
        logger.error(`Admin forgot password error - ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        logger.info("admin verifyotp OTP verification request received", { email });

        if (!email || !otp) {
            logger.warn("admin verifyotp Email or OTP missing in request", { email, otp });
            return res.status(400).json({
                status: 400,
                message: ["Email and OTP are required"],
            });
        }

        const user = await adminModel.findOne({ email });

        if (!user) {
            logger.warn("admin verifyotp not found during OTP verification", { email });
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        if (user.otp !== otp) {
            logger.warn("admin verifyotp Invalid OTP entered", { email, enteredOtp: otp });
            return res.status(400).json({
                status: 400,
                message: ["Invalid OTP"],
            });
        }

        const currentTime = new Date();
        if (user.otpExpire < currentTime) {
            logger.warn("admin verifyotp OTP expired", { email, otpExpire: user.otpExpire });
            return res.status(400).json({
                status: 400,
                message: ["OTP has expired"],
            });
        }

        user.otp = undefined;
        user.otpExpire = undefined;

        await user.save();

        logger.info("admin verifyotp OTP verified successfully", { email });

        return res.status(200).json({
            status: 200,
            message: ["OTP verified successfully."],
        });

    } catch (error) {
        logger.error("admin verifyotp Error during OTP verification", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const setPassword = async (req, res) => {
    try {
        const { password, email } = req.body;

        logger.info("admin setPassword Set password request received", { email });

        if (!email || !password) {
            logger.warn("admin setPassword Set password failed - Missing email or password");
            return res.status(400).json({
                status: 400,
                message: ["Please provide email, and password to proceed."],
            });
        }

        const user = await adminModel.findOne({ email });

        if (!user) {
            logger.warn("admin setPassword Set password failed - User not found", { email });
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        const hashedPassword = await hashPassword(password);
        user.password = hashedPassword;
        await user.save();

        logger.info("admin setPassword Password updated successfully", { email });

        return res.status(200).json({
            status: 200,
            message: ["Your password has been updated successfully."],
        });

    } catch (error) {
        logger.error("admin setPassword Error while setting password", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const getProfileById = async (req, res) => {
    try {
        logger.info(`admin profile Fetching user with ID: ${req.params.id}`);

        let aggregation = [];

        aggregation.push({
            $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
        });
        aggregation.push({
            $project: {
                _id: 0,
                password: 0,
                otp: 0,
                otpExpire: 0,
                __v: 0
            }
        })

        const user = await adminModel.aggregate(aggregation);

        if (!user.length) {
            logger.warn(`admin profile not found: ${req.params.id}`);
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        logger.info(`admin profile fetched successfully: ${req.params.id}`);
        return res.status(200).json({
            status: 200,
            message: ["User fetched successfully"],
            data: user
        });
    } catch (error) {
        logger.error(`admin profile Error fetching user: ${req.params.id}`, { error });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const checkAndSaveLocation = async ({ locationName, zipCode, geoJsonData }) => {
    try {
        if (!locationName || !zipCode || !geoJsonData) {
            return {
                success: false,
                status: 400,
                message: ['Location name, zip code, and geoJsonData are required']
            };
        }

        if (
            !geoJsonData.type || geoJsonData.type !== 'FeatureCollection' ||
            !Array.isArray(geoJsonData.features) || geoJsonData.features.length === 0
        ) {
            return {
                success: false,
                status: 400,
                message: ['geoJsonData must be a valid FeatureCollection with at least one feature']
            };
        }

        const feature = geoJsonData.features[0];
        if (!feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) {
            return {
                success: false,
                status: 400,
                message: ['Feature geometry is missing or invalid']
            };
        }

        const existingLocation = await locationModel.findOne({ zipCode });
        if (existingLocation) {
            return {
                success: false,
                status: 400,
                message: ['Location with this zip code already exists']
            };
        }

        let geometryType = feature.geometry.type;
        let coordinates = feature.geometry.coordinates;

        if (
            geometryType === 'MultiPolygon' &&
            Array.isArray(coordinates) &&
            Array.isArray(coordinates[0]) &&
            Array.isArray(coordinates[0][0]) &&
            Array.isArray(coordinates[0][0][0])
        ) {
            console.warn("⚠️ Detected extra nested MultiPolygon, flattening one level");
            coordinates = coordinates.flat();
        }

        const newLocation = new locationModel({
            name: locationName,
            zipCode: zipCode,
            geometry: {
                type: feature.geometry.type,
                coordinates:coordinates
            }
        });

        await newLocation.save();

        return {
            success: true,
            locationId: newLocation._id
        };
    } catch (err) {
        return {
            success: false,
            status: 500,
            message: [err.message || 'Something went wrong while saving location']
        };
    }
};

const toggleAdminStatus = async (req, res) => {
    try {
        const { adminId } = req.params;

        logger.info("Request received to toggle admin status", { adminId });

        const admin = await adminModel.findById(adminId);
        if (!admin) {
            logger.warn("Admin not found while toggling status", { adminId });
            return res.status(404).json({
                status: 404,
                message: ["Admin not found"]
            });
        }

        const previousStatus = admin.isActive;
        admin.isActive = !admin.isActive;
        await admin.save();

        logger.info("Admin isActive status updated", {
            adminId,
            from: previousStatus,
            to: admin.isActive
        });

        res.status(200).json({
            status: 200,
            message: [`Admin is now ${admin.isActive ? 'active' : 'inactive'}`]
        });
    } catch (error) {
        logger.error("Error toggling admin isActive status", { error: error.message });
        res.status(500).json({
            status: 500,
            message: [error.message]
        });
    }
};

const getAllAdmins = async (req, res) => {
    try {
        const { filters, sortField, sortBy, offset, limit } = req.body;
        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);
        let aggregation = [];

        aggregation.push({
            $lookup: {
                from: "locations",
                localField: "location",
                foreignField: "_id",
                as: "locationDetails"
            }
        });

        aggregation.push({
            $unwind: {
                path: "$locationDetails",
                preserveNullAndEmptyArrays: true
            }
        });

        aggregation.push({
            $match: {
                role: 'admin'
            }
        })

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

        if (filters?.locationName) {
            aggregation.push({
                $match: {
                    "locationDetails.name": { $regex: filters.locationName, $options: "i" }
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
            $project: {
                name: 1,
                email: 1,
                mobile: 1,
                role: 1,
                isActive: 1,
                'locationDetails.name': 1
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

        const [result] = await adminModel.aggregate(aggregation);
        const total = result.totalCount[0]?.count || 0;
        logger.info(`admin-Fetched-users ${result.data.length} users`);

        return res.status(200).json({
            status: 200,
            message: ['Videos fetched successfully.'],
            data: result.data,
            total
        });
    } catch (error) {
        logger.error("Error fetching admins", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message]
        });
    }
}

export {
    adminRegister,
    login,
    forgatePassword,
    verifyOtp,
    setPassword,
    getProfileById,
    toggleAdminStatus,
    getAllAdmins
};