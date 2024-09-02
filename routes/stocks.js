const express = require('express');
const router = express.Router();
const stocks = require('../services/stocks');
const logger = require('../services/logger');

// Preliminary middleware for caching
/*
  const redisClient = require('../services/redis');
  const cache = (req, res, next) => {
  const cacheKey = `${req.originalUrl}`; // Create a unique cache key
  redisClient.get(cacheKey, (err, data) => {
    if (err) {
      logger.error('Error while getting data from cache', err);
      return next(err);
    }
    if (data) {
      logger.info(`Cache hit for ${cacheKey}`);
      return res.send(JSON.parse(data));
    }
    next();
  });
};
*/

// Internal server error handling
router.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

let totalQueryTime = 0;
let requestCount = 0;

// Basic performance logging middleware for all routes
function measurePerformance(req, res, next) {
  req.startTime = Date.now();
  
  res.on('finish', () => {
    const elapsed = Date.now() - req.startTime;
    totalQueryTime += elapsed;
    requestCount += 1;
    const averageQueryTime = totalQueryTime / requestCount;

    logger.info(`Request to ${req.originalUrl} took ${elapsed}ms`);
    logger.info(`Session average query time: ${averageQueryTime.toFixed(2)}ms`);
  });
  
  next();
}

router.use(measurePerformance);

// Apply caching middleware and route handling
router.get('/', async (req, res, next) => {
  try {
    const includePrices = req.query.includePrices === 'true';
    const filters = {
      exchangeSymbol: req.query.exchangeSymbol || null,
      minScoreTotal: parseInt(req.query.minScoreTotal) || null
    };

    const timeIntervalDays = req.query.timeIntervalDays || 90;
    const sortBy = req.query.sortBy || 'score';
    const sortOrder = req.query.sortOrder || 'asc';

    const queryStart = Date.now();
    const result = await stocks.getAllTickersInfo(includePrices, filters, timeIntervalDays, sortBy, sortOrder);
    const queryDuration = Date.now() - queryStart;
    logger.info(`Query for all tickers took ${queryDuration}ms`);
    
    res.json(result);
  } 
  catch (err) {
    logger.error('Error while getting all stocks');
    next(err);
  }
});

router.get('/:ticker', async (req, res, next) => {
  try {
    const ticker = req.params.ticker;
    const getAllPrices = req.query.getAllPrices === 'true';

    const queryStart = Date.now();
    const result = await stocks.getTickerInfoWithClose(ticker, getAllPrices);
    const queryDuration = Date.now() - queryStart;
    logger.info(`Query for ticker ${ticker} took ${queryDuration}ms`);

    res.json(result);
  }
  catch (err) {
    logger.error('Error while getting stock information');
    next(err);
  }
});

router.get('/:ticker/score', async (req, res, next) => {
  try {
    const ticker = req.params.ticker;

    const queryStart = Date.now();
    const result = await stocks.getTickerScore(ticker);
    const queryDuration = Date.now() - queryStart;

    res.json(result);
  }
  catch (err) {
    logger.error('Error while getting stock score');
    next(err);
  }
});

module.exports = router;
