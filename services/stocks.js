const db = require('./db');
const config = require('../config');
const logger = require('./logger');
const moment = require('moment');

/**
 * Retrieves company information based on a ticker symbol.
 *
 * @param {string} ticker - The ticker symbol of the company.
 * @returns {Object|null} The company data if found, otherwise null.
 * @throws {Error} If the query fails.
 */
function getTickerInfo(ticker) {
  const data = db.query('SELECT * FROM swsCompany WHERE ticker_symbol = ?', [ticker])// Syncronous query via better-sqlite3
  return data[0]; // Assuming unique ticker_symbol
}

/**
 * Retrieves company information along with the latest share price.
 *
 * @param {string} ticker - The ticker symbol of the company.
 * @param {boolean} getAllPrices - Whether or not to retrieve multiple prices in the response or just the latest (defaults to false).
 * @returns {Object} An object containing the company data and the latest share price
 * @returns {Object|null} return.data - The company data if found, otherwise null.
 * @returns {Array<Object>|Object|null} return.closeData - An array of historical prices if `getAllPrices` is true, or the latest price if `getAllPrices` is false. Null if no prices are found.
 * @throws {Error} If the query fails.
 */
function getTickerInfoWithClose(ticker, getAllPrices = false) {
  const data = getTickerInfo(ticker);

  if (!data) return { data: null, prices: null };

  const [query, queryParams] = getAllPrices
  ? [
      'SELECT date, price FROM swsCompanyPriceClose WHERE company_id = ? ORDER BY date ASC',
      [data.id]
    ]
  : [
      'SELECT date, price FROM swsCompanyPriceClose WHERE company_id = ? ORDER BY date DESC LIMIT 1',
      [data.id]
    ];
  
  const closeData = db.query(query, queryParams);
  
  return {
    data,
    closeData: getAllPrices ? closeData : closeData[0] || null
    // Note: Potentially overengineered for this task but closeData has been made extensible and compatible with common time series formatting in charting libs. Could improve further by intaking an interval for price output.
  };
}

/**
 * Retrieves the company score based on the ticker symbol.
 *
 * @param {string} ticker - The ticker symbol of the company.
 * @returns {Object} An object containing the company data and the company score.
 * @returns {Object|null} return.data - The company data if found, otherwise null.
 * @returns {Object|null} return.scoreData - The score data if found, otherwise null.
 * @throws {Error} If the query fails.
 */
function getTickerScore(ticker) {
  const data = getTickerInfo(ticker);

  if (!data) return { data: null, scoreData: null };

  const query = 'SELECT * FROM swsCompanyScore WHERE id = ?';
  const scoreData = db.query(query, [data.score_id]); // Assuming companies score_id are unique
  return {
    data,
    scoreData: scoreData[0] || null
  }
}

// As this is a dev helper function it does not need JSDoc commenting.
// Calculates the volatitlity of a company's stock based on a historical price array.
function calculateVolatility(prices) {
  if (prices.lengthj < 2) return 0;

  // Calculate daily returns across the series, and the average
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i].price - prices[i - 1].price / prices[i - 1].price);
    returns.push(returnValue);
  }

  const avgReturn = returns.reduce((sum, value) => sum + Math.pow(value - avgReturn, 2), 0) / returns.length;

  // Calculate variance and std dev as percentage
  const stdDeviation = Math.sqrt(avgReturn);
  logger.info(`Logged calculated volatility of ${stdDeviation * 100}`);
  return stdDeviation * 100;
}

/**
 * Returns an array of company entities, optionally with each company's past share prices.
 * 
 * @param {number} [page=1] - The pagination page number (defaults to 1).
 * @param {boolean} [includePrices=false] - Whether or not to include the past share prices in the response (defaults to false).
 * @returns {Object} An object containing the data and pagination metadata. 
 * @returns {Array<Object>} return.data - An array of company objects. If `includesPrices` is true, each object includes a list of past prices.
 * @returns {Object} return.meta - Metadata about the current page.
 * @returns {number} return.meta.page - The current page number. 
 */
function getAllTickersInfo(page = 1, includePrices = false, filters = {}, sortBy = 'score', sortOrder = 'asc') {
  const limit = config.listPerPage;
  const offset = (page - 1) * limit;

  let baseQuery = `
    SELECT  c.id,
            c.ticker_symbol,
            c.name,
            c.exchange_symbol,
            s.total,
            p.price,
            p.date
    FROM swsCompany c 
    LEFT JOIN swsCompanyScore s on c.id = s.company_id
    LEFT JOIN (
      SELECT  company_id,
              price,
              date
      FROM swsCompanyPriceClose
      WHERE date >= ?
    ) p on c.id = p.company_id
    WHERE 1=1
  `;

  const params = [moment().subtract(90, 'days').format('YYYY-MM-DD')];

  // Check and apply any filters from parameters
  if (filters.exchangeSymbol) {
    baseQuery += ' AND c.exchange_symbol = ?';
    params.push(filters.exchangeSymbol);
  }

  if (filters.minScoreTotal != undefined) {
    baseQuery += ' AND s.total >= ?';
    params.push(filters.minScoreTotal);
  }

  if (sortBy === 'score') {
    baseQuery += ` ORDER BY s.total ${sortOrder}`;
  } 

  baseQuery += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  logger.info(params);
  logger.info(sortBy);
  logger.info(baseQuery);

  // Query DB and generate output
  const companies = db.query(baseQuery, params);
 
  logger.info(`Companies:\n ${companies}`);

  if (includePrices) {
    // Group prices by company ID
    const companiesWithPrices = companies.reduce((acc, company) => {
      const { id, ticker_symbol, name, exchange_symbol, score, price, date } = company;
      if (!acc[id]) {
        acc[id] = {
          id,
          ticker_symbol,
          name,
          exchange_symbol,
          score,
          prices: []
        };
      }
      if (price !== null) {
        acc[id].prices.push({ price, date });
      }
      return acc;
    }, {});

    // Calculate volatility for each company
    const result = Object.values(companiesWithPrices).map(company => ({
      ...company,
      volatility: calculateVolatility(company.prices),
    }));
    
    // Create inline sort now that we have the volatility figure of each ticker
    if(sortBy === 'volatility') {
      result.sort((a, b) => (sortOrder === 'asc' ? a.volatility - b.volatility : b.volatility - a.volatility));
    }

    return {
      data: result,
      meta: { page }
    };
  } 

  else {
    // Remove prices if not needed
    const result = companies.map(({ price, date, ...company }) => company);
    return {
      data: result,
      meta: { page }
    };
  }
} 

// PREV IMPLEMENTATION
function getAllTickersInfoPrevious(page = 1, includePrices = false) {
  const offset = (page - 1) * config.listPerPage;
  const query = 'SELECT * FROM swsCompany LIMIT ? OFFSET ?';
  const companies = db.query(query, [config.listPerPage, offset]);
 
  logger.debug(`Offset: ${offset}, Limit: ${config.listPerPage}`);
  logger.debug(`Query: ${query}`);
  logger.debug(`Companies: ${companies}`);

  if (includePrices) {
    const companiesWithPrices = companies.map(company => {
      const priceQuery = 'SELECT * FROM swsCompanyPriceClose WHERE company_id = ? ORDER BY date';
      // Note: This SQL query will not scale well across larger tables and should have a display limit
      const prices = db.query(priceQuery, [company.id]);
      return {
        ...company,
        prices
      };
    });

    return {
      data: companiesWithPrices,
      meta: { page }
    };
  } 

  else {
    return  {
      data: companies,
      meta: { page }
    };
  } 
}

module.exports = {
  getAllTickersInfo,
  getAllTickersInfoPrevious,
  getTickerInfo,
  getTickerInfoWithClose,
  getTickerScore
}
