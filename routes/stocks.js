const express = require('express');
const router = express.Router();
const stocks = require('../services/stocks');

router.get('/', function(req, res, next) {
  try {
    res.json(stocks.getMultiple(req.query.page));
  } catch(err) {
    console.error('Error while getting stocks ', err.message);
    next(err);
  }
});
