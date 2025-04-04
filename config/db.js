import mongoose from 'mongoose';
import {logger} from "../utils/logger.js"

const connectToDatabase = async (dbUri) => {
  try {    
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB successfully');
    logger.info('Connected to MongoDB successfully')
  } catch (error) {
    console.log('Connection unsuccessfull');
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectToDatabase;