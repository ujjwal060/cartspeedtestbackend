import {logger} from "./logger.js";

const validateSchema =async(schema, data) => {
    try {
        await schema.validateAsync(data, { abortEarly: false });
        return null;
    } catch (error) {
        if (error.isJoi) {
            const validationErrors = error.details.map((err) => err.message);
            logger.error(`Validation Error: ${JSON.stringify(validationErrors)}`);

            return validationErrors;
        }
        logger.error(`Unexpected Validation Error: ${error.message}`);
        throw error;
    }
};

export {
    validateSchema
}