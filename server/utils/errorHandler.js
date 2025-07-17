const CustomError=require('./CustomError');
const logger = require('./logger');
const STATUS = require('@config/statusCodes');
const {getRequestId} = require('@utils/requestContext');

const errorHandler=(err,req,res,next)=>{
    const statusCode= err.statusCode ||err.status|| STATUS.INTERNAL_SERVER_ERROR;
    const environment=process.env.NODE_ENV || 'development';
     logger.error(err.message, {
        statusCode,
        stack: err.stack,
        path:req.originalUrl,
        method:req.method,
        ...(req.user && {userId: req.user._id || req.user.id}),
    });

    const response={
        success: false,
        message: err.message || 'Internal Server Error',
    }
    if (environment === 'development' || environment === 'testing') {
    response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

module.exports=errorHandler;
