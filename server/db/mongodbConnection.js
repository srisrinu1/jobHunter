const mongoose = require('mongoose');

let isConnected = false;
const getMongoUri = () => {
  const env = process.env.NODE_ENV;
  if (env === 'production') return process.env.MONGODB_URI_PRODUCTION;
  if (env === 'testing')    return process.env.MONGODB_URI_TESTING;
  if (env === 'development')return process.env.MONGODB_URI_DEVELOPMENT;
  throw new Error('NODE_ENV or MongoDB URI is not set');
};

const connectDB=async()=>{
    if (isConnected) return mongoose.connection;
  const uri = getMongoUri();
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

module.exports={
    connectDB
}
