import express from 'express';
import './utils/cronJob.js';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import { loadConfig } from './config/loadConfig.js';
import connectToDatabase from './config/db.js';
import { logger } from "./utils/logger.js";
import userRoutes from './usersManagement/routes/index.js';
import adminRoutes from './adminManagement/routes/adminRoutes.js'

const startServer = async () => {
    try {
        const config = await loadConfig();
        const app = express();

        const corsOptions = {
            // origin: ['*'],
            origin: '*',
            credentials: true
        }

        app.use(cors(corsOptions));
        app.use(express.json());
        app.use(fileUpload());

        await connectToDatabase(config.DB_URI);

        app.use('/api', userRoutes);
        app.use('/api',adminRoutes);

        const PORT = config.PORT || 9090;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Server failed to start: ${error.message}`);
    }

};

startServer();