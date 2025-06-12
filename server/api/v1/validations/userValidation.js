const joi= require('joi');
const STATUS=require('@utils/statusCodes');

const validateSignup=(req,res,next)=>{
    const schema=joi.object({
        name: joi.string().min(3).max(100).required(),
        email: joi.string().email().required(),
        password: joi.string()
            .min(8)
            .max(128)
            .pattern(new RegExp('(?=.*[a-z])'))
            .pattern(new RegExp('(?=.*[A-Z])'))
            .pattern(new RegExp('(?=.*\\d)'))
            .pattern(new RegExp('(?=.*[!@#$%^&*])'))
            .pattern(new RegExp('^[^\\s]+$'))
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character, and no spaces',
    'string.empty': 'Password is required',
  }),
avatar: joi.string().optional().allow(''),
role: joi.string().valid('user', 'admin').default('user'),
    });
    const {error}=schema.validate(req.body, { abortEarly: false });
    if(error){
        const messages = error.details.map(d => d.message).join(', ');
        return res.status(STATUS.BAD_REQUEST).json({
            success: false,
            message: messages
        });
    }
    next();
}

const validateLogin=(req,res,next)=>{
    const schema=joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8).required(),
    });
    const {error}=schema.validate(req.body, { abortEarly: false });
    if(error){
        const messages = error.details.map(d => d.message).join(', ');
        return res.status(STATUS.BAD_REQUEST).json({
            success: false,
            message: messages
        });
    }
    next();
}

module.exports={
    validateSignup,
    validateLogin
};