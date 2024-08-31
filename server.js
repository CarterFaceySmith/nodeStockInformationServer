const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const logger = require('./services/logger');
const stocksRouter = require('./routes/stocks');

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

// Graceful exit on SIGINT
process.on('SIGINT', () => {
  console.log('SIGINT detected, shutting down server...');
  db.close((err) => {
    if (err) {
      logger.error('Error closing database', err);
    }
    else {
      logger.info('Database closed');
    }
    process.exit(0);
  });
});

app.listen(port, () => {
  logger.info(`Stock information server listening at http://localhost:${port}`);
});
