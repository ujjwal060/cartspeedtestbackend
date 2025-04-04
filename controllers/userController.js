import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import UserModel from '../models/userModel.js';
import { hashPassword} from '../utils/passwordUtils.js';
import { generateOTP, sendOTP } from '../utils/otpUtils.js';
import { logger } from "../utils/logger.js";

const registerUser = async (req, res) => {
    try {
        logger.info("User registration request received", { body: req.body });
        const { name, email, mobile, state, password } = req.body;

        const existingUser = await UserModel.findOne({ $or: [{ email }, { mobile }] });

        if (existingUser) {
            if (existingUser.email === email && existingUser.mobile === mobile) {
                logger.warn("Attempt to register with existing email and mobile", { email, mobile });
                return res.status(400).json({
                    status: 400,
                    message: ['Email and mobile are already registered. Please use a different email or mobile.'],
                });
            } else if (existingUser.email === email) {
                logger.warn("Attempt to register with existing email", { email });
                return res.status(400).json({
                    status: 400,
                    message: ['Email is already registered. Please use a different email.'],
                });
            } else if (existingUser.mobile === mobile) {
                logger.warn("Attempt to register with existing mobile", { mobile });
                return res.status(400).json({
                    status: 400,
                    message: ['Mobile number is already registered. Please use a different mobile number.'],
                });
            }
        }

        logger.info("Hashing password for user", { email });
        const hashedPassword = await hashPassword(password);
        const otp = generateOTP();
        const user = new UserModel({
            name,
            email,
            mobile,
            state,
            password: hashedPassword,
            otp,
            otpExpire: new Date(Date.now() + 10 * 60 * 1000),
        });

        await user.save();
        logger.info("User registered successfully, OTP generated", { email, mobile, otp });

        const otpSent = await sendOTP(mobile, otp);

        if (!otpSent.success) {
            logger.error("OTP sending failed", { mobile, error: otpSent.message });
            return res.status(500).json({
                status: 500,
                message: otpSent.message,
            });
        }

        logger.info("OTP sent successfully", { mobile });
        return res.status(200).json({
            status: 200,
            message: ['User registered successfully. OTP sent to mobile.'],
        });
    } catch (error) {
        logger.error("Error in user registration", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp, type } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                status: 400,
                message: ["Email and OTP are required"],
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                status: 400,
                message: ["Invalid OTP"],
            });
        }

        const currentTime = new Date();
        if (user.otpExpire < currentTime) {
            return res.status(400).json({
                status: 400,
                message: ["OTP has expired"],
            });
        }

        if (type === 'register') {

            const accessToken = jwt.sign(
                { userId: user._id },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1h" }
            );

            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "30d" }
            );

            user.otp = null;
            user.otpExpire = null;
            user.refreshToken = refreshToken;
            await user.save();

            return res.status(200).json({
                status: 200,
                message: ["OTP verified successfully"],
                data: {
                    accessToken,
                    refreshToken,
                }
            });
        } else {
            user.otp = null;
            user.otpExpire = null;
            await user.save();

            return res.status(200).json({
                status: 200,
                message: ["OTP verified successfully. You can now reset your password."],
                data: user
            });
        }

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        if (!password || (!email && !mobile)) {
            return res.status(400).json({
                status: 400,
                message: ["Email or Mobile and password are required"],
            });
        }

        const user = await UserModel.findOne({
            $or: [{ email }, { mobile }]
        });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: ["User not found with the provided email or mobile. Please check the details and try again."],
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                status: 400,
                message: ["The password you entered is incorrect. Please check and try again."],
            });
        }

        const accessToken = jwt.sign(
            { userid: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "30d" }
        );

        user.refreshToken = refreshToken;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: ["Login successful"],
            data: {
                accessToken,
                refreshToken,
            }
        });

    } catch (error) {
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
            return res.status(400).json({
                status: 400,
                message: ["Please provide a valid email address to proceed."],
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: ["Account not found with the provided email. Please check the email and try again."],
            });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const otpSent = await sendOTP(user.mobile, otp);

        if (!otpSent.success) {
            return res.status(500).json({
                status: 500,
                message: otpSent.message,
            });
        }

        return res.status(200).json({
            status: 200,
            message: ["OTP has been sent to your mobile."],
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const setPassword = async (req, res) => {
    try {
        const { password, email } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 400,
                message: ["Please provide email, and password to proceed."],
            });
        }

        const user = await UserModel.findOne({ email });

        const hashedPassword = await hashPassword(password);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: ["Your password has been updated successfully."],
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const resendOtp = async (req, res) => {
    try {
        const { email, mobile } = req.body;

        if (!email && !mobile) {
            return res.status(400).json({
                status: 400,
                message: ["Please provide your registered email or mobile."],
            });
        }

        const user = await UserModel.findOne({
            $or: [{ email }, { mobile }]
        });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: ["Account not found with the provided email or mobile. Please check and try again."],
            });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const otpSent = await sendOTP(user.mobile, otp);

        if (!otpSent.success) {
            return res.status(500).json({
                status: 500,
                message: otpSent.message,
            });
        }

        return res.status(200).json({
            status: 200,
            message: ["A new OTP has been sent to your registered mobile number"],
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const logOut = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        user.refreshToken = null;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: ["Logout successful"],
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const changePassword = async (req, res) => {
    try {
        const { userId } = req.user;
        const { password } = req.body;

        const user = await UserModel.findById(userId);

        const hashedPassword = await hashPassword(password);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: ["Password changed successfully"],
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getProfileById = async (req, res) => {
    try {
        logger.info(`Fetching user with ID: ${req.params.id}`);

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
                refreshToken: 0,
                referrals: 0,
                __v: 0
            }
        })

        const user = await UserModel.aggregate(aggregation);

        if (!user.length) {
            logger.warn(`User not found: ${req.params.id}`);
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        logger.info(`User fetched successfully: ${req.params.id}`);
        return res.status(200).json({
            status: 200,
            message: ["User fetched successfully"],
            data: user
        });
    } catch (error) {
        logger.error(`Error fetching user: ${req.params.id}`, { error });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateFields = req.body;

        if (Object.keys(updateFields).length === 0) {
            logger.warn(`No fields provided for update - User ID: ${userId}`);
            return res.status(400).json({
                status: 400,
                message: ["No fields provided for update"],
            });
        }

        logger.info(`Updating profile for user ID: ${userId} with fields: ${Object.keys(updateFields)}`);

        const userExists = await UserModel.findById(userId);
        if (!userExists) {
            logger.warn(`User not found - User ID: ${userId}`);
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        if (updateFields.email) {
            const emailExists = await UserModel.findOne({
                email: updateFields.email,
                _id: { $ne: userId }
            });

            if (emailExists) {
                logger.warn(`Email already in use: ${updateFields.email} - User ID: ${userId}`);
                return res.status(400).json({
                    status: 400,
                    message: ["Email already in use"],
                });
            }
        }

        if (updateFields.mobile) {
            const mobileExists = await UserModel.findOne({
                mobile: updateFields.mobile,
                _id: { $ne: userId }
            });

            if (mobileExists) {
                logger.warn(`Mobile number already in use: ${updateFields.mobile} - User ID: ${userId}`);
                return res.status(400).json({
                    status: 400,
                    message: ["Mobile number already in use"],
                });
            }
        }
        const updateResult = await UserModel.updateOne(
            { _id:userId },
            { $set: updateFields }
        );

        if (updateResult.matchedCount === 0) {
            logger.warn(`User not found for update - User ID: ${userId}`);
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        if (updateResult.modifiedCount === 0) {
            logger.info(`No changes made for User ID: ${userId}`);
            return res.status(200).json({
                status: 200,
                message: ["No changes made"]
            });
        }

        logger.info(`Profile updated successfully - User ID: ${userId}, Fields: ${Object.keys(updateFields)}`);
        return res.status(200).json({
            status: 200,
            message: [`Profile updated successfully. Updated fields: ${Object.keys(updateFields).join(", ")}`]
        });
    } catch (error) {
        logger.error(`Error updating profile for user ID: ${req.params.userId}`, { error });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}


export {
    registerUser,
    verifyOtp,
    loginUser,
    forgatePassword,
    setPassword,
    resendOtp,
    logOut,
    changePassword,
    getProfileById,
    updateProfile
};