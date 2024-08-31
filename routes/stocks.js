const express = require('express');
const router = express.Router();
const stocks = require('../services/stocks');

router.get('/', function(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const includePrices = req.query.includePrices === 'true';
    const result = stocks.getAllTickersInfo(page, includePrices);
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
    const result = stocks.getTickerInfoWithClose(ticker);
    res.json(result);
  }
  catch (err) {
    console.error('Error while getting stock information');
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
    console.error('Error while getting stock score');
    next(err);
  }
})

module.exports = router;
