const morgan = require('morgan');
const stripAnsi = require('strip-ansi').default;
const logger = require('@utils/logger');
const { getRequestId,getUserId } = require('@utils/requestContext');

// Custom tokens using asyncLocalStorage context
morgan.token('request-id', () => {
    try {
        return getRequestId() || 'unknown';
    } catch {
        return 'unknown';
    }
});
morgan.token('user-id', () => {
    try {
        return getUserId() || 'anonymous';
    } catch {
        return 'anonymous';
    }
});

const env = process.env.NODE_ENV || 'development';
const getMorganFormat = () => {
    switch (env) {
        case 'production':
            return ':remote-addr :method :url :status :res[content-length] - :response-time ms :request-id :user-id';
        case 'testing':
            return 'tiny';
        default:
            return 'dev';
    }
};

// Skip health checks in testing
const skipHealthCheck = (req) => req.url === '/health' || req.url === '/ping';

const morganMiddleware = morgan(getMorganFormat(), {
    stream: {
        write: (message) => {
            try {
                 logger.http(stripAnsi(message.trim()));
            } catch (err) {
                console.error('Morgan logger error:', err, message);
            }
        }
    },
    skip: env === 'testing' ? skipHealthCheck : undefined
});

module.exports = morganMiddleware;