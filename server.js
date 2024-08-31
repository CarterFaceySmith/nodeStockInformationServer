const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const stocksRouter = require('./routes/stocks');

app.get('/', (req, res) => {
  res.json({message: 'Stock server active.'});
});

app.use('/stocks', stocksRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Graceful exit on SIGINT
process.on('SIGINT', () => {
  console.log('SIGINT detected, shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database', err);
    }
    else {
      console.log('Database closed');
    }
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`Stock information server listening at http://localhost:${port}`);
});
