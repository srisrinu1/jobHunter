const {authService}=require('@services');
const {formatUserResponse}=require('@utils/responseHelper');
const STATUS = require('@utils/statusCodes');

const isProduction = process.env.NODE_ENV === 'production';
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
        const reqMeta= {userAgent: req.get('User-Agent'), ip: req.ip };
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
        const refreshToken=req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(STATUS.UNAUTHORIZED).json({
                success: false,
                status: 'Refresh token is required'
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
        const token= await authService.requestPasswordReset(req.body.email);
        //Send the token via mail 
        //For now,we will keep it idle.We will implement the email service later
        res.status(STATUS.OK).json({
            success: true,
            message: 'If that email is in our system, you will receive a password reset link shortly',
        });

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



