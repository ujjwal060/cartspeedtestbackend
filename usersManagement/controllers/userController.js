import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import UserModel from '../../models/userModel.js';
import { hashPassword } from '../../utils/passwordUtils.js';
import { generateOTP, sendEmail } from '../../utils/otpUtils.js';
import { emailTamplates } from "../../utils/emailTemplate.js";
import { logger } from "../../utils/logger.js";
import { loadConfig } from "../../config/loadConfig.js";


const registerUser = async (req, res) => {
    try {
        logger.info("User registration request received", { body: req.body });
        const { name, email, mobile, address } = req.body;

        const existingUser = await UserModel.findOne({ $or: [{ email }, { mobile }] });

        // if (existingUser) {
        //     if (existingUser.email === email && existingUser.mobile === mobile) {
        //         logger.warn("Attempt to register with existing email and mobile", { email, mobile });
        //         return res.status(400).json({
        //             status: 400,
        //             message: ['Email and mobile are already registered. Please use a different email or mobile.'],
        //         });
        //     } else if (existingUser.email === email) {
        //         logger.warn("Attempt to register with existing email", { email });
        //         return res.status(400).json({
        //             status: 400,
        //             message: ['Email is already registered. Please use a different email.'],
        //         });
        //     } else if (existingUser.mobile === mobile) {
        //         logger.warn("Attempt to register with existing mobile", { mobile });
        //         return res.status(400).json({
        //             status: 400,
        //             message: ['Mobile number is already registered. Please use a different mobile number.'],
        //         });
        //     }
        // }

        if (existingUser) {
            if (existingUser.isVerified) {
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
            } else {
                const otp = generateOTP();
                existingUser.otp = otp;
                existingUser.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
                await existingUser.save();

                logger.info("Resending OTP for unverified user", { email, otp });

                const { subject, body } = emailTamplates.otpVerification(existingUser.name, otp);
                const otpSent = await sendEmail({ email: existingUser.email, subject, body });

                if (!otpSent.success) {
                    logger.error("OTP resend failed", { mobile, error: otpSent.message });
                    return res.status(500).json({
                        status: 500,
                        message: [otpSent.message],
                    });
                }

                logger.info("OTP resent successfully", { mobile });
                return res.status(200).json({
                    status: 200,
                    message: ['User already exists but not verified. OTP resent successfully.'],
                });
            }
        }

        const otp = generateOTP();
        const user = new UserModel({
            name,
            email,
            mobile,
            address,
            otp,
            otpExpire: new Date(Date.now() + 10 * 60 * 1000),
        });

        await user.save();
        logger.info("User registered successfully, OTP generated", { email, otp });

        const { subject, body } = emailTamplates.otpVerification(name, otp);
        const otpSent = await sendEmail({ email, subject, body });

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
        const { email, otp } = req.body;

        logger.info("OTP verification request received", { email });

        if (!email || !otp) {
            logger.warn("Email or OTP missing in request", { email, otp });
            return res.status(400).json({
                status: 400,
                message: ["Email and OTP are required"],
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            logger.warn("User not found during OTP verification", { email });
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        if (user.otp !== otp) {
            logger.warn("Invalid OTP entered", { email, enteredOtp: otp });
            return res.status(400).json({
                status: 400,
                message: ["Invalid OTP"],
            });
        }

        const currentTime = new Date();
        if (user.otpExpire < currentTime) {
            logger.warn("OTP expired", { email, otpExpire: user.otpExpire });
            return res.status(400).json({
                status: 400,
                message: ["OTP has expired"],
            });
        }

        user.otp = undefined;
        user.otpExpire = undefined;

        await user.save();

        logger.info("OTP verified successfully", { email });

        return res.status(200).json({
            status: 200,
            message: ["OTP verified successfully. Your account is now verified."],
            data: user
        });

    } catch (error) {
        logger.error("Error during OTP verification", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const config = await loadConfig();

        const { email, mobile, password } = req.body;

        logger.info("Login request received", { email, mobile });

        if (!password || (!email && !mobile)) {
            logger.warn("Login failed - Missing email/mobile or password", { email, mobile });
            return res.status(400).json({
                status: 400,
                message: ["Email or Mobile and password are required"],
            });
        }

        const user = await UserModel.findOne({
            $or: [{ email }, { mobile }]
        });

        if (!user) {
            logger.warn("Login failed - User not found", { email, mobile });
            return res.status(404).json({
                status: 404,
                message: ["User not found with the provided email or mobile. Please check the details and try again."],
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn("Login failed - Incorrect password", { email, mobile });
            return res.status(400).json({
                status: 400,
                message: ["The password you entered is incorrect. Please check and try again."],
            });
        }

        const accessToken = jwt.sign(
            { userid: user._id },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: "30d" }
        );

        user.refreshToken = refreshToken;
        await user.save();

        logger.info("User logged in successfully", { userId: user._id });

        return res.status(200).json({
            status: 200,
            message: ["Login successful"],
            data: {
                accessToken,
                refreshToken,
                userId: user._id
            }
        });

    } catch (error) {
        logger.error("Error during login", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const forgatePassword = async (req, res) => {
    try {
        const { email } = req.body;

        logger.info("Forgot password request received", { email });

        if (!email) {
            logger.warn("Forgot password failed - Email missing");
            return res.status(400).json({
                status: 400,
                message: ["Please provide a valid email address to proceed."],
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            logger.warn("Forgot password failed - User not found", { email });
            return res.status(404).json({
                status: 404,
                message: ["Account not found with the provided email. Please check the email and try again."],
            });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        logger.info("OTP generated and saved", { email, otp });

        const { subject, body } = emailTamplates.otpVerification(user.name, otp);
        const otpSent = await sendEmail({ email, subject, body });

        if (!otpSent.success) {
            logger.error("Failed to send OTP", { email, error: otpSent.message });
            return res.status(500).json({
                status: 500,
                message: otpSent.message,
            });
        }

        logger.info("OTP sent successfully", { email });

        return res.status(200).json({
            status: 200,
            message: ["OTP has been sent to your Email."],
        });

    } catch (error) {
        logger.error("Error in forgot password", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

const setPassword = async (req, res) => {
    try {
        const { password, email } = req.body;

        logger.info("Set password request received", { email });

        if (!email || !password) {
            logger.warn("Set password failed - Missing email or password");
            return res.status(400).json({
                status: 400,
                message: ["Please provide email, and password to proceed."],
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            logger.warn("Set password failed - User not found", { email });
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        const hashedPassword = await hashPassword(password);
        user.password = hashedPassword;
        await user.save();

        logger.info("Password updated successfully", { email });

        return res.status(200).json({
            status: 200,
            message: ["Your password has been updated successfully."],
        });

    } catch (error) {
        logger.error("Error while setting password", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

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

        const { subject, body } = emailTamplates.otpVerification(user.name, otp);
        const otpSent = await sendEmail({ email, subject, body });

        if (!otpSent.success) {
            return res.status(500).json({
                status: 500,
                message: otpSent.message,
            });
        }

        return res.status(200).json({
            status: 200,
            message: ["A new OTP has been sent to your registered Email"],
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

        logger.info("Change password request received", { userId });

        const user = await UserModel.findById(userId);

        if (!user) {
            logger.warn("User not found for password change", { userId });
            return res.status(404).json({
                status: 404,
                message: ["User not found"],
            });
        }

        const hashedPassword = await hashPassword(password);
        user.password = hashedPassword;
        await user.save();

        logger.info("Password changed successfully", { userId });

        return res.status(200).json({
            status: 200,
            message: ["Password changed successfully"],
        });

    } catch (error) {
        logger.error("Error in changePassword", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};

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
            data: user[0]
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
            { _id: userId },
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

const updateProfileImage = async (req, res) => {
    try {
        const { userId } = req.params;
        const imageUrl = req.fileLocations[0];

        if (!imageUrl) {
            return res.status(400).json({
                status: 400,
                message: ['No image uploaded.'],
            });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { image: imageUrl },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: 404,
                message: ['User not found.'],
            });
        }

        return res.status(200).json({
            status: 200,
            message: ['Profile image updated successfully.'],
            data: updatedUser,
        });

    } catch (error) {
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
    updateProfile,
    updateProfileImage
};