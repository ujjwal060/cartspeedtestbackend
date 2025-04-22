import jwt from 'jsonwebtoken';
import { loadConfig } from '../../config/loadConfig.js';
import adminModel from '../models/adminModel.js';
import { logger } from '../../utils/logger.js';

const verifyToken = async (req, res) => {
    const config = await loadConfig();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(400).json({
            status: 400,
            message: ["Token is required in Authorization header."],
        });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

        return res.status(200).json({
            status: 200,
            message: ["Token is valid"],
            valid: true,
            userId: decoded.userId,
        });
        
    } catch (error) {
        logger.error(`Token verification failed. Error: ${error.message}`);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 401,
                valid: false,
                expired: true,
                message: ["Token has expired. Please refresh token."],
            });
        }

        return res.status(401).json({
            status: 401,
            valid: false,
            message: [error.message],
        });
    }
};

const refreshToken = async (req, res) => {
    const config = await loadConfig();
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            status: 400,
            message: ["Refresh token is required."],
        });
    }

    try {
        const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);

        const user = await adminModel.findOne({ userId: decoded.userId });

        const newAccessToken = jwt.sign(
            { id: user._id,role:user.role,email:user.email },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            status: 200,
            message: ["Token refreshed successfully."],
            accessToken: newAccessToken,
        });
    } catch (error) {
        logger.error(`Refresh token failed. Error: ${error.message}`);
        return res.status(401).json({
            status: 401,
            message: [error.message],
        });
    }
};

const verifyTokenMiddleware = async (req, res, next) => {
    const config = await loadConfig();
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        status: 400,
        message: ["Token is required in Authorization header."],
      });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      logger.error(`Token verification failed. Error: ${error.message}`);
      return res.status(401).json({
        status: 401,
        valid: false,
        message: [error.message],
      });
    }
  };

export { verifyToken, refreshToken, verifyTokenMiddleware };
