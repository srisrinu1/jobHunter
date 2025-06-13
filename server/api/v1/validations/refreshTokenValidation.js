const joi   = require('joi');
const mongoose = require('mongoose');
const { baseModelName } = require('../models/userModel');

const objectIdValidator = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('Invalid user ObjectId');;
    }
    return value;
};

const refreshTokenValidationSchema = joi.object({
    user:joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required(),
    token:joi.string()
        .min(32)
        .required(),
    expiresAt:joi.date()
        .greater('now')
        .required(),
    blacklisted:joi.boolean()
        .default(false),
    userAgent:joi.string()
        .allow('')
        .optional(),
    ip:joi.string()
       .ip({ versions: ['ipv4', 'ipv6'], cidr: 'forbidden' })
       .allow('')
       .optional(),   
});

module.exports = { refreshTokenValidationSchema };