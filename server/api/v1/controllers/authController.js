const {authService}=require('@services');
const {formatUserResponse}=require('@utils/responseHelper');
const STATUS = require('@utils/statusCodes');
const logger = require('@utils/logger');
const { getRequestId } = require('@utils/requestContext');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const cookieOptions_accessToken = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'Strict' : 'Lax',
    maxAge: 15 * 60 * 1000
};
const cookieOptions_refreshToken = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'Strict' : 'Lax',
    maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_MS, 10) || 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res,next) => {
     try{
        const reqMeta= {userAgent: req.get('User-Agent'), ip: req.ip };
        const { user,accessToken,refreshToken}=await authService.registerUser(req.body,reqMeta);
        res.cookie('accessToken',accessToken,cookieOptions_accessToken)
        .cookie('refreshToken', refreshToken, cookieOptions_refreshToken)
        .status(STATUS.CREATED)
        .json(
            {  
                success: true,
                status: 'Registration successful',
                data: {
                    user:formatUserResponse(user)
                }
            }
        )

     }catch(error) {
        next(error);
     }
}

const login = async (req, res,next) => {
    try{
        const reqMeta = { userAgent: req.get('User-Agent'), ip: req.ip };
        logger.info(`Login attempt from IP: ${reqMeta.ip}, email: ${req.body.email}`);
        const { user, accessToken, refreshToken } = await authService.loginUser(req.body.email, req.body.password,reqMeta);
        res.cookie('accessToken', accessToken, cookieOptions_accessToken)
        .cookie('refreshToken', refreshToken, cookieOptions_refreshToken)
        .status(STATUS.OK)
        .json({
            success: true,
            status: 'Login successful',
            data: {
                user: formatUserResponse(user)
            }
        });
    }catch(error) {
        next(error);
    }
}

const refresh = async (req, res,next) => {
    try{
        // Debug logging
        logger.info(`Request method: ${req.method}`);
        logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
        logger.info(`Request body type: ${typeof req.body}`);
        logger.info(`Request body: ${JSON.stringify(req.body)}`);
        logger.info(`Request cookies type: ${typeof req.cookies}`);
        logger.info(`Request cookies: ${JSON.stringify(req.cookies)}`);
        
        // Check if req.body exists
        if (!req.body) {
            logger.error('req.body is undefined - express.json() middleware not working');
            return res.status(STATUS.BAD_REQUEST).json({
                success: false,
                status: 'Request body is missing',
                requestId: getRequestId()
            });
        }
        
        // Check if req.cookies exists
        if (!req.cookies) {
            logger.error('req.cookies is undefined - cookie-parser middleware not working');
        }
        
        const refreshToken = (req.cookies && req.cookies.refreshToken) || 
                           (req.body && req.body.refreshToken);
        logger.info(`Refresh token: ${refreshToken}`);
        
        if(!refreshToken){
            return res.status(STATUS.UNAUTHORIZED).json({
                success: false,
                status: 'Refresh token is required',
                requestId: getRequestId()
            });
        }
        const reqMeta= {userAgent: req.get('User-Agent'), ip: req.ip };
        const {accessToken,refreshToken:newrefreshToken}=await authService.refreshTokens(refreshToken,reqMeta);
        res.cookie('accessToken', accessToken, cookieOptions_accessToken)
        .cookie('refreshToken', newrefreshToken, cookieOptions_refreshToken)
        .status(STATUS.OK)
        .json({
            success: true,
            status: 'Token refreshed successfully',
        });

    }catch(error){
        next(error);
    }
}

const logOut=async (req, res,next) => {
    try{
        const refreshToken=req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(STATUS.UNAUTHORIZED).json({
                success: false,
                status: 'Refresh token is required'
            });
        }
        await authService.logOutUser(refreshToken);
        res.clearCookie('accessToken')
        .clearCookie('refreshToken')
        .status(STATUS.OK)
        .json({
            success: true,
            status: 'Logged out successfully'
        });

    }catch(error){
        next(error);
    }
}

const requestPasswordReset = async (req, res,next) => {
    try{
        const token = await authService.requestPasswordReset(req.body.email);
        // For manual testing, include the token in the response
        if (isDevelopment) {
            response={
                success: true,
                message: 'If that email is in our system, you will receive a password reset link shortly',
                resetToken: token
            };
        }
        else{
            response={
                success: true,
                message: 'If that email is in our system, you will receive a password reset link shortly'
            };
        }
        res.status(STATUS.OK).json(response);
    }catch(error){
        res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'If that email is in our system, you will receive a password reset link shortly',
        })
    }
}

const resetPassword = async (req, res,next) => {
    try{
        const token=req.query.token;
        const {newPassword } = req.body;
        if(!token){
            return res.status(STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Reset Token is required'
            });
        }
        await authService.resetPassword(token, newPassword);
        res.status(STATUS.OK).json({
            success: true,
            message: 'Password reset successfully'
        });
    }catch(error){
        next(error);
    }
}

const getUserProfile=async(req,res,next)=>{
    try{
        const userId=req.user._id;
        const user=await authService.getUserProfile(userId);
        res.status(STATUS.OK).json({
            success: true,
            data: {
                user: formatUserResponse(user)
            }
        });
    }catch(error){
        next(error);
    }
}

module.exports = {
    register,
    login,
    refresh,
    logOut,
    requestPasswordReset,
    resetPassword,
    getUserProfile
};



