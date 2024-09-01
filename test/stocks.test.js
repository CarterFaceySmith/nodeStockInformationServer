
const chai = import('chai');
const expect = chai.expect;
const sinon = require('sinon');
const stocks = require('../services/stocks');
const db = require('../services/db'); // Adjust if your db service is in a different location

describe('Stocks Service', function() {
  // Example of a basic test for getAllTickersInfo
  describe('getAllTickersInfo', function() {
    it('should return a list of companies', async function() {
      // Mocking the database query
      const mockCompanies = [
        { id: 1, ticker_symbol: 'AAPL', name: 'Apple Inc.', exchange_symbol: 'NASDAQ', total: 100, price: 150, date: '2024-08-01' },
        { id: 2, ticker_symbol: 'GOOGL', name: 'Alphabet Inc.', exchange_symbol: 'NASDAQ', total: 200, price: 2500, date: '2024-08-01' }
      ];

      // Stub the db.query method to return mock data
      const queryStub = sinon.stub(db, 'query').resolves(mockCompanies);

      // Call the function
      const result = await stocks.getAllTickersInfo(1, false, {}, 'score', 'asc');

      // Assert the result
      expect(result.data).to.be.an('array').that.has.lengthOf(2);
      expect(result.data[0]).to.have.property('ticker_symbol', 'AAPL');
      expect(result.data[1]).to.have.property('ticker_symbol', 'GOOGL');

      // Restore the original method
      queryStub.restore();
    });
  });

  // Example of a basic test for getTickerInfoWithClose
  describe('getTickerInfoWithClose', function() {
    it('should return the details and prices of a ticker', async function() {
      // Mocking the data
      const mockTickerInfo = {
        id: 1,
        ticker_symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange_symbol: 'NASDAQ',
        prices: [
          { price: 150, date: '2024-08-01' },
          { price: 155, date: '2024-08-02' }
        ]
      };

      // Stub the db.query method to return mock data
      const queryStub = sinon.stub(db, 'query').resolves(mockTickerInfo);

      // Call the function
      const result = await stocks.getTickerInfoWithClose('AAPL', true);

      // Assert the result
      expect(result).to.have.property('ticker_symbol', 'AAPL');
      expect(result.prices).to.be.an('array').that.has.lengthOf(2);
      expect(result.prices[0]).to.include({ price: 150, date: '2024-08-01' });

      // Restore the original method
      queryStub.restore();
    });
  });
});
