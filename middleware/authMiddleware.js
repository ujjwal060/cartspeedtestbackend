import jwt from "jsonwebtoken";
import UserModel from '../models/userModel.js';
import { loadConfig } from '../config/loadConfig.js';
import {logger} from '../utils/logger.js';


const authenticateUser = async (req, res, next) => {
    const config = await loadConfig();
    const authHeader = req.headers.authorization;
    logger.error("Unauthorized access attempt. Missing or invalid token.");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: 401,
            message: ["Unauthorized access."],
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

        req.user = {
            userId: decoded.userid,
        };
        logger.info(`User authenticated. User ID: ${decoded.userid}`);
        next();
    } catch (error) {
        logger.error(`Token verification failed. Error: ${error.message}`);
        return res.status(401).json({
            status: 401,
            message: ["expired token. Please login again."],
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const config = await loadConfig();
        const token=req.body.refreshToken;
        
        const decoded = jwt.verify(token,config.REFRESH_TOKEN_SECRET);

        const user = await UserModel.findOne({ _id: decoded.userId, refreshToken:token });

        if (!user) {
            logger.error(`Invalid refresh token. User not found for token: ${token}`);
            return res.status(403).json({
                status: 403,
                message: ["Invalid refresh token."],
            });
        }

        const newAccessToken = jwt.sign(
            { userid: user.id, email: user.email, mobile: user.mobile },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
        );

        logger.info(`New access token generated for User ID: ${user.id}`);

        return res.status(200).json({
            status: 200,
            message: ["New access token generated."],
            accessToken: newAccessToken,
        });
    } catch (error) {
        logger.error(`Refresh token error: ${error.message}`);
        return res.status(403).json({
            status: 403,
            message: ["Expired refresh token. Please login again."],
        });
    }
}

export {
    authenticateUser,
    refreshToken,
};
