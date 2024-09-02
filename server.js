
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const logger = require('./services/logger');
const stocksRouter = require('./routes/stocks');
const rateLimit = require('express-rate-limit');
const config = require('./config');

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.requestRateLimit, // Max requests per windowMs per IP address
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
});

app.use(limiter);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Root Route - Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
  logger.info('Serving index.html');
});

// API Routes
app.use('/stocks', stocksRouter);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error('Global error handler:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Graceful Shutdown
const gracefulShutdown = () => {
  logger.info('SIGINT detected. Shutting down gracefully...');
  // Close server and database connections if needed
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(port, () => {
  logger.info(`Stock information server listening at http://localhost:${port}`);
});
