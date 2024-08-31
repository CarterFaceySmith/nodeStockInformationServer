const express = require('express');
const router = express.Router();
const stocks = require('../services/stocks');
const logger = require('../services/logger');

router.get('/', function(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const includePrices = req.query.includePrices === 'true';
    const filters = {
      exchangeSymbol: req.query.exchangeSymbol || null,
      minScoreTotal: parseInt(req.query.minScoreTotal) || null
    };

    const sortBy = req.query.sortBy || 'score';
    const sortOrder = req.query.sortOrder || 'asc';

    const result = stocks.getAllTickersInfo(page, includePrices, filters, sortBy, sortOrder);
    res.json(result);
  } 
  catch (err) {
    logger.error('Error while getting all stocks');
    next(err);
  }
});

router.get('/prevStocks', function(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const includePrices = req.query.includePrices === 'true';
    const result = stocks.getAllTickersInfoPrevious(page, includePrices);
    res.json(result);
  } 
  catch (err) {
    console.error('Error while getting all stocks');
    next(err);
  }
});

router.get('/:ticker', function(req, res, next) {
  try {
    const ticker = req.params.ticker;
    const getAllPrices = req.query.getAllPrices === 'true';
    const result = stocks.getTickerInfoWithClose(ticker, getAllPrices);
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
    const result = stocks.getTickerScore(ticker);
    res.json(result);
  }
  catch (err) {
    logger.error('Error while getting stock score');
    next(err);
  }
})

module.exports = router;
