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
const attachUserId = require('@middleware/attachUserId');
const { authRoutes } = require('@routes');
const errorHandler = require('@utils/errorHandler');

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5000;


// Middleware to generate and set request ID
app.use(generatedRequestId);
app.use(passport.initialize());
// Import and use the attachUserId middleware
app.use(attachUserId);

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
