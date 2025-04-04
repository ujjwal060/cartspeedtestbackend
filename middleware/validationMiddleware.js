import { validateSchema } from '../utils/validationUtils.js';
import {logger} from '../utils/logger.js';

const validateRequest =(schema) => async (req, res, next) => {
    const errors = await validateSchema(schema, req.body);
    if (errors) {
        logger.error(`Validation failed for request body: ${JSON.stringify(req.body)}. Errors: ${errors.join(', ')}`);
        return res.status(400).json({status:400, message:errors });
    }
    logger.info(`Validation passed for request body: ${JSON.stringify(req.body)}`);
    next();
};

export{
    validateRequest
}