const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const logger = require('./services/logger');
const stocksRouter = require('./routes/stocks');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15min
  max: config.requestRateLimit,// 100req per windowMs per IP addr
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
});

app.use(limiter);

app.get('/', (req, res) => {
  res.json({message: 'Stock server active.'});
  logger.info('Receiving connection');
});

app.use('/stocks', stocksRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error('Global error handler:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Amended better-sqlite3 graceful exit code 
process.on('SIGINT', () => {
  console.log('\nSIGINT detected, shutting down server...');
  logger.info('Shutting down server gracefully...');
  
  // Log the shutdown and exit process
  logger.info('Database will be closed automatically by the process exit.');

  // Exit the process
  process.exit(0);
});

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
