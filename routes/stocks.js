const express = require('express');
const router = express.Router();
const stocks = require('../services/stocks');
const logger = require('../services/logger');

// Basic performance logging middleware for all routes
function measurePerformance(req, res, next) {
  req.startTime = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - req.startTime;
    logger.info(`Request to ${req.originalUrl} took ${elapsed}ms`);
  });
  next();
}

router.use(measurePerformance);

router.get('/', function(req, res, next) {
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
    const result = stocks.getAllTickersInfo(includePrices, filters, timeIntervalDays, sortBy, sortOrder);
    const queryDuration = Date.now() - queryStart;
    logger.info(`Query for all tickers took ${queryDuration}ms`)

    res.json(result);
  } 
  catch (err) {
    logger.error('Error while getting all stocks');
    next(err);
  }
});

router.get('/:ticker', function(req, res, next) {
  try {
    const ticker = req.params.ticker;
    const getAllPrices = req.query.getAllPrices === 'true';
    
    const queryStart = Date.now();
    const result = stocks.getTickerInfoWithClose(ticker, getAllPrices);
    const queryDuration = Date.now() - queryStart;
    logger.info(`Query for ticker ${ticker} took ${queryDuration}ms`);

    res.json(result);
  }
  catch (err) {
    logger.error('Error while getting stock information');
    next(err);
  }
});

router.get('/:ticker/score', function(req, res, next) {
  try {
    const ticker = req.params.ticker;
    
    const queryStart = Date.now();
    const result = stocks.getTickerScore(ticker);
    const queryDuration = Date.now() - queryStart;

    res.json(result);
  }
  catch (err) {
    logger.error('Error while getting stock score');
    next(err);
  }
})

module.exports = router;
