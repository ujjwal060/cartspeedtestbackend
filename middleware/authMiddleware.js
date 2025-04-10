import jwt from "jsonwebtoken";
import UserModel from '../usersManagement/models/userModel.js';
import {logger} from '../utils/logger.js';


const authenticateUser = (req, res, next) => {
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
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        req.user = {
            userId: decoded.userid,
        };
        logger.info(`User authenticated. User ID: ${decoded.userId}`);
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
        const token=req.body.refreshToken;
        
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        const user = await UserModel.findOne({ _id: decoded.userId, refreshToken:token });

        if (!user) {
            logger.error(`Invalid refresh token. User not found for token: ${token}`);
            return res.status(403).json({
                status: 403,
                message: ["Invalid refresh token."],
            });
        }

        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email, mobile: user.mobile },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
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
    refreshToken
};
