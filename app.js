const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import utilities
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const dormRoutes = require('./routes/dorm.routes');
const debtRoutes = require('./routes/debt.routes');

// Import old routes (for backwards compatibility)
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

/**
 * ============================================
 * DATABASE CONNECTION
 * ============================================
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dorm-debt-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

/**
 * ============================================
 * SECURITY MIDDLEWARE
 * ============================================
 */
// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

/**
 * ============================================
 * LOGGING MIDDLEWARE
 * ============================================
 */
// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

/**
 * ============================================
 * BODY PARSING MIDDLEWARE
 * ============================================
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * ============================================
 * STATIC FILES & VIEWS (Legacy)
 * ============================================
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

/**
 * ============================================
 * API ROUTES
 * ============================================
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API v1 routes
app.use('/api/auth', authRoutes);
app.use('/api/dorms', dormRoutes);
app.use('/api/debts', debtRoutes);

// Legacy routes (backwards compatibility)
app.use('/', indexRouter);
app.use('/users', usersRouter);

/**
 * ============================================
 * ERROR HANDLING
 * ============================================
 */
// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

/**
 * ============================================
 * GRACEFUL SHUTDOWN
 * ============================================
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

module.exports = app;
