const passport=require('@config/passport');
const STATUS=require('@utils/statusCodes');

const authenticateJWT = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
        if (!user) {
        return res.status(STATUS.UNAUTHORIZED).json({
            success:false,
             message: 'Unauthorized' });
        }
        req.user = user;
        next();
    })(req, res, next);
    }

const authorizeRoles = (...roles) => (req, res, next) => {
    if(!req.user){
        return res.status(STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Unauthorized: No user authenticated',
        });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(STATUS.FORBIDDEN).json({
            success: false,
            message: 'Forbidden: You do not have permission to access this resource'
        });
    }
    next();
};

module.exports = {
    authenticateJWT,
    authorizeRoles
};
