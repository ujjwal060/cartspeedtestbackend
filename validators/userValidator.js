import Joi from 'joi';

const userValidationSchema = Joi.object({
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
    mobile: Joi.string()
        .pattern(/^\+[1-9][0-9]{0,3}[1-9][0-9]{9}$/)
        .required()
        .messages({
            'string.base': 'Mobile number must be a string.',
            'string.empty': 'Mobile number is required.',
            'string.pattern.base': 'Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.',
            'any.required': 'Mobile number is required.',
        }),
    address: Joi.string().required().messages({
        'string.base': 'address must be a string.',
        'string.empty': 'address is required.',
        'any.required': 'address is required.',
    }),
    otp: Joi.string().optional().allow('').messages({
        'string.base': 'OTP must be a string.',
    }),
    otpExpire: Joi.date().optional().allow('').messages({
        'date.base': 'OTP Expiry must be a valid date.',
    })
});

const loginValidationSchema = Joi.object({
    email: Joi.string().email().optional().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be valid.',
    }),
    mobile: Joi.string()
        .pattern(/^\+[1-9][0-9]{0,3}[1-9][0-9]{9}$/)
        .optional()
        .messages({
            'string.base': 'Mobile number must be a string.',
            'string.pattern.base': 'Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.',
        }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 128 characters.',
        'any.required': 'Password is required.',
    }),
    deviceToken: Joi.string().optional().allow('').messages({
        'string.base': 'Device token must be a string.',
    }),
}).xor('email', 'mobile');

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

const userValidationSchemaOTP = Joi.object({
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

const updateProfileSchema = Joi.object({
    name: Joi.string().min(3).max(50).trim()
        .messages({
            "string.min": "Name should have at least 3 characters",
            "string.max": "Name should not exceed 50 characters",
        }),

    email: Joi.string().email().lowercase()
        .messages({
            'string.base': 'Email must be a string.',
            'string.email': 'Email must be valid.',
            'any.required': 'Email is required.',
        }),

    mobile: Joi.string().pattern(/^\+91[0-9]{10}$/)
        .messages({
            'string.base': 'Mobile number must be a string.',
            'string.empty': 'Mobile number is required.',
            'string.pattern.base': 'Mobile number must include a valid country code and be in the format: +<country code><10-digit number>.',
            'any.required': 'Mobile number is required.',
        }),

    state: Joi.string().min(2).max(50).trim()
        .messages({
            "string.min": "State should have at least 2 characters",
            "string.max": "State should not exceed 50 characters",
        }),
}).min(1)
    .messages({
        "object.min": "At least one field is required for update"
    });

export {
    userValidationSchema,
    loginValidationSchema,
    setPasswordValidationSchema,
    userValidationSchemaOTP,
    updateProfileSchema
};