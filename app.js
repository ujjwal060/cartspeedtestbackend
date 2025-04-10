import express from 'express';
import cors from 'cors';
import { loadConfig } from './config/loadConfig.js';
import connectToDatabase from './config/db.js';
import { logger } from "./utils/logger.js";
import routes from './usersManagement/routes/index.js';

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

        await connectToDatabase(config.DB_URI);

        app.use('/', routes);

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