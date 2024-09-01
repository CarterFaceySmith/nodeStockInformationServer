const request = require('supertest');
const express = require('express');
const path = require('path');
const assert = require('assert');

// Create a mock Express app for testing
const app = express();
app.use(express.json());

const stocksRouter = require(path.join(__dirname, '../routes/stocks'));
app.use('/stocks', stocksRouter);

describe('Stocks API', () => {

  // Test basic request
  it('should retrieve the first page of stocks', async () => {
    const response = await request(app).get('/stocks');
    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.body.data));
  });

  // Test pagination
  it('should retrieve the second page of stocks if it exists', async () => {
    const response = await request(app).get('/stocks?page=2');
    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.body.data));
  });

  // Test including prices
  it('should retrieve stocks with historical prices', async () => {
    const response = await request(app).get('/stocks?includePrices=true');
    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.body.data));
    response.body.data.forEach(stock => {
      assert(stock.prices !== undefined); // Ensure prices are included
    });
  });

  // Test filtering by exchange symbol
  it('should retrieve stocks filtered by exchange symbol', async () => {
    const response = await request(app).get('/stocks?exchangeSymbol=NASDAQ');
    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.body.data));
    response.body.data.forEach(stock => {
      assert.strictEqual(stock.exchange_symbol, 'NASDAQ');
    });
  });

  // Test filtering by minimum score total
  it('should retrieve stocks with a minimum score total', async () => {
    const response = await request(app).get('/stocks?minScoreTotal=15');
    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.body.data));
    response.body.data.forEach(stock => {
      assert(stock.total >= 15);
    });
  });

  // Test sorting by score in descending order
  it('should retrieve stocks sorted by score in descending order', async () => {
    const response = await request(app).get('/stocks?sortBy=score&sortOrder=desc');
    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.body.data));
    let previousScore = Infinity;
    response.body.data.forEach(stock => {
      assert(stock.total <= previousScore);
      previousScore = stock.total;
    });
  });

  // Test specifying time interval days
  it('should retrieve stocks with a specified time range for price data', async () => {
    const response = await request(app).get('/stocks?timeIntervalDays=30');
    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.body.data));
  });

  // Test retrieving information for a specific ticker
  it('should retrieve information for the ticker AAPL', async () => {
    const response = await request(app).get('/stocks/AAPL');
    assert.strictEqual(response.status, 200);
    assert(response.body.data !== undefined);
    assert(response.body.data.ticker_symbol === 'AAPL');
  });

  // Test including all historical prices for a specific ticker
  it('should retrieve information for the ticker AAPL including all historical prices', async () => {
    const response = await request(app).get('/stocks/AAPL?getAllPrices=true');
    assert.strictEqual(response.status, 200);
    assert(response.body.data !== undefined);
    assert(response.body.closeData !== undefined);
  });

  // Test retrieving the score for a specific ticker
  it('should retrieve the score for the ticker AAPL', async () => {
    const response = await request(app).get('/stocks/AAPL/score');
    assert.strictEqual(response.status, 200);
    assert(response.body.data !== undefined);
    assert(response.body.scoreData !== undefined);
  });

});
