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
    state: Joi.string().required().messages({
        'string.base': 'State must be a string.',
        'string.empty': 'State is required.',
        'any.required': 'State is required.',
    }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
        'string.max': 'Password cannot exceed 128 characters.',
        'any.required': 'Password is required.',
    }),
    role:Joi.string().required().messages({
        'string.base': 'Role must be a string.',
        'string.empty': 'Role is required.',
        'any.required': 'Role is required.',
    }),
});


export {
    adminValidationSchema,
};