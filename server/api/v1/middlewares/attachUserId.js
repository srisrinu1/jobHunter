const {setUserId, getUserId} = require('@utils/requestContext');
const attachUserId = (req, res, next) => {
    if( req.user && req.user._id) {
        setUserId(req.user._id?.toString() || req.user.id);
    }
    next();
};

module.exports = 
{attachUserId};
