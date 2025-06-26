const {v4: uuidv4} = require('uuid');

const generatedRequestId = (req, res, next) => {
    let requestId=req.headers['x-request-id']||uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
}

module.exports=generatedRequestId;
