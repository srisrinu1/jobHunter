const {v4: uuidv4} = require('uuid');
const { asyncLocalStorage } = require('@utils/requestContext');

const generatedRequestId = (req, res, next) => {
    let requestId=req.headers['x-request-id']||uuidv4();
    try {
        asyncLocalStorage.run({ requestId }, () => {
            res.setHeader('X-Request-Id', requestId);
            next();
        });
    } catch (error) {
        next(error);
    }
}

module.exports=generatedRequestId;
