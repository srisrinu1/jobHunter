require('module-alias/register');
const express = require('express');
const app=express();
const cors = require('cors');
require('dotenv').config();
const {connectDB} = require('./db');
const generatedRequestId=require('@middleware/requestId');
const passport = require('passport');
const attachUserId = require('@middleware/attachUserId');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const environment = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;


// Middleware to generate and set request ID
app.use(generatedRequestId);
app.use(passport.initialize());
// Import and use the attachUserId middleware
app.use(attachUserId);

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
