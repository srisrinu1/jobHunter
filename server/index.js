require('module-alias/register');
const express = require('express');
const app=express();
app.set('trust proxy', true);
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Load environment-specific .env file
const environment = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${environment}` });
const {connectDB} = require('./db');
const generatedRequestId=require('@middleware/requestId');
const passport = require('passport');
const helmet = require('helmet');
const attachUserId = require('@middleware/attachUserId');
const { authRoutes } = require('@routes');
const errorHandler = require('@utils/errorHandler');
const morganMiddleware = require('@middleware/morganMiddleware');
const logger = require('./utils/logger');

if(environment==='production'){
   const allowedOrigins = process.env.ALLOWED_ORIGINS_PRODUCTION
     ? process.env.ALLOWED_ORIGINS_PRODUCTION.split(',')
     : [];
   const corsOptions = {
     origin: (origin, callback) => {
       try {
         if (!origin || allowedOrigins.includes(origin)) {
           return callback(null, true);
         } else {
           logger.warn(`Blocked CORS request from origin: ${origin}`);
           return callback(new Error('CORS policy violation: Origin not allowed'), false);
         }
       } catch (err) {
         logger.error(`CORS origin check failed: ${err.message}`);
         return callback(new Error('CORS internal error'), false);
       }
     },
     credentials: true
   };
   app.use(cors(corsOptions));
}
else{
  app.use(cors());
}

// Environment-specific Helmet security headers
if (environment === 'production') {
  // Production: Strict security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
  }));
} else if (environment === 'development') {
  // Development: Relaxed CSP for hot reloading and dev tools
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow eval for dev tools
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "ws:", "wss:"], // Allow websockets for hot reload
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for dev flexibility
    crossOriginOpenerPolicy: false,
    dnsPrefetchControl: { allow: true },
    frameguard: { action: 'sameorigin' },
    hidePoweredBy: true,
    hsts: false, // No HTTPS enforcement in dev
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
    xssFilter: true,
  }));
} else {
  // Testing: Minimal security headers to avoid interference with tests
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for tests
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    dnsPrefetchControl: false,
    frameguard: false,
    hsts: false,
    referrerPolicy: false,
    hidePoweredBy: true, // Always hide Express signature
    noSniff: true,
    xssFilter: true,
  }));
}

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5000;


// Middleware to generate and set request ID
app.use(generatedRequestId);
app.use(morganMiddleware);
app.use(passport.initialize());


// Routes
app.use('/api/v1/auth', authRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

(async () => {
  try {
    // Connect to MongoDB before starting the server
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${environment} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Exit on failure to connect DB
  }
})();
