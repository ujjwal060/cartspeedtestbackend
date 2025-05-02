import Joi from 'joi';

const adminValidationSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.base': 'Name must be a string.',
        'string.empty': 'Name is required.',
        'string.min': 'Name must be at least 3 characters.',
        'string.max': 'Name cannot exceed 50 characters.',
        'any.required': 'Name is required.',
    }),
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
        'any.required': 'Email is required.',
    }),
    mobile: Joi.string().optional()
        .pattern(/^\+[1-9][0-9]{0,3}[1-9][0-9]{9}$/)
        // .required()
        .messages({
            'string.base': 'Mobile number must be a string.',
            'string.empty': 'Mobile number is required.',
            'string.pattern.base': 'Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.',
            'any.required': 'Mobile number is required.',
        }),
    locationName: Joi.string().required().messages({
        'string.base': 'Location must be a string.',
        'string.empty': 'Location is required.',
        'any.required': 'Location is required.',
    }),
    latitude: Joi.number().required().messages({
        'number.base': 'Latitude must be a number.',
        'any.required': 'Latitude is required.'
    }),
    longitude: Joi.number().required().messages({
        'number.base': 'Longitude must be a number.',
        'any.required': 'Longitude is required.'
    }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 128 characters.',
        'any.required': 'Password is required.',
    }),
    role: Joi.string().required().messages({
        'string.base': 'Role must be a string.',
        'string.empty': 'Role is required.',
        'any.required': 'Role is required.',
    }),
});

const loginValidationSchema = Joi.object({
    email: Joi.string().email().optional().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
    }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 128 characters.',
        'any.required': 'Password is required.',
    }),
});

const setPasswordValidationSchema = Joi.object({
    email: Joi.string().email().optional().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
    }),
    password: Joi.string().min(6).max(15).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 15 characters.',
        'any.required': 'Password is required.',
    })
});

const adminValidationSchemaOTP = Joi.object({
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
        'any.required': 'Email is required.',
    }),
    otp: Joi.string().optional().allow('').messages({
        'string.base': 'OTP must be a string.',
    }),
    type: Joi.string().valid('register', null).optional().messages({
        'string.base': 'Type must be a string.',
        'any.only': 'Type must be either "register" or null.',
    }),
});

export {
    adminValidationSchema,
    loginValidationSchema,
    setPasswordValidationSchema,
    adminValidationSchemaOTP
};