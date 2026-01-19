const mongoose = require('mongoose');

/**
 * Database Configuration
 * Handles MongoDB connection with proper error handling and events
 */

// MongoDB connection URI - use environment variable or default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hato_elfloos';

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex: true, // Deprecated in Mongoose 6+
  // useFindAndModify: false, // Deprecated in Mongoose 6+
};

/**
 * Connect to MongoDB
 * @returns {Promise} MongoDB connection
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, options);
    
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);
    console.log(`  Port: ${conn.connection.port}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✓ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠ Mongoose disconnected from MongoDB');
});

// Handle application termination
const gracefulShutdown = async (msg, callback) => {
  try {
    await mongoose.connection.close();
    console.log(`✓ Mongoose disconnected through ${msg}`);
    callback();
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    callback();
  }
};

// For nodemon restarts
process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// For app termination
process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});

// For Heroku app termination
process.on('SIGTERM', () => {
  gracefulShutdown('Heroku app shutdown', () => {
    process.exit(0);
  });
});

module.exports = connectDB;
