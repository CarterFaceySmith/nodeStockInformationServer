
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
async function getTickerInfo(ticker) {
  try {
    const data = db.query('SELECT * FROM swsCompany WHERE ticker_symbol = ?', [ticker]);
    return data[0]; // Assuming unique ticker_symbol
  } catch (error) {
    logger.error('Error fetching ticker info', error);
    throw new Error('Failed to retrieve ticker information');
  }
}

/**
 * Retrieves company information along with the latest share price.
 *
 * @param {string} ticker - The ticker symbol of the company.
 * @param {boolean} getAllPrices - Whether or not to retrieve multiple prices in the response or just the latest (defaults to false).
 * @returns {Object} An object containing the company data and the latest share price
 * @throws {Error} If the query fails.
 */
async function getTickerInfoWithClose(ticker, getAllPrices = false) {
  try {
    const data = await getTickerInfo(ticker);

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
    };
  } catch (error) {
    logger.error('Error fetching ticker info with close data', error);
    throw new Error('Failed to retrieve ticker information with close data');
  }
}

/**
 * Retrieves the company score based on the ticker symbol.
 *
 * @param {string} ticker - The ticker symbol of the company.
 * @returns {Object} An object containing the company data and the company score.
 * @throws {Error} If the query fails.
 */
async function getTickerScore(ticker) {
  try {
    const data = await getTickerInfo(ticker);

    if (!data) return { data: null, scoreData: null };

    const query = 'SELECT * FROM swsCompanyScore WHERE id = ?';
    const scoreData = db.query(query, [data.score_id]); // Assuming companies score_id are unique
    return {
      data,
      scoreData: scoreData[0] || null
    };
  } catch (error) {
    logger.error('Error fetching ticker score', error);
    throw new Error('Failed to retrieve ticker score');
  }
}

// Calculates the volatility of a company's stock based on a historical price array.
function calculateVolatility(prices) {
  if (prices.length < 2) {
    logger.error('Price array has length below 2, unable to calculate volatility');
    return 0;
  }

  const priceValues = prices.map(p => p.price);
  const avg = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
  const variance = priceValues.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / priceValues.length;
  
  // Return standard deviation from avg - volatility
  return Math.sqrt(variance);
}

/**
 * Returns an array of company entities, optionally with each company's past share prices.
 * 
 * @param {boolean} [includePrices=false] - Whether or not to include the past share prices in the response (defaults to false).
 * @param {Object} [filters={}] - Optional filters to apply to the results.
 * @param {string} [filters.exchangeSymbol] - The exchange symbol to filter companies by.
 * @param {number} [filters.minScoreTotal] - The minimum score total to filter companies by.
 * @param {number} [timeRangeDays=90] - The number of days of historical price data to include (defaults to 90).
 * @param {string} [sortBy='score'] - The field to sort by (e.g., 'score', 'volatility').
 * @param {string} [sortOrder='asc'] - The sort order ('asc' or 'desc').
 * 
 * @returns {Object} An object containing the data and pagination metadata. 
 * @returns {Array<Object>} return.data - An array of company objects. If `includePrices` is `true`, each object includes a list of past prices.
 * @returns {Object} return.meta - Metadata about the current page.
 * @returns {number} return.meta.page - The current page number.
 */
async function getAllTickersInfo(includePrices = false, filters = {}, timeRangeDays = 90, sortBy = 'score', sortOrder = 'asc') {
  try {
    // Calculate the start and end dates for price data range
    // Uncomment the following lines to use dynamic date calculations
    // const endDate = moment().format('YYYY-MM-DD');
    // const startDate = moment().subtract(timeRangeDays, 'days').format('YYYY-MM-DD');
  
    // Hardcoded values for demo purposes
    const endDate = '2020-05-22';
    const startDate = '2020-03-25';   

    let baseQuery = `
      SELECT  c.id,
              c.ticker_symbol,
              c.name,
              c.exchange_symbol,
              s.total
      FROM swsCompany c 
      LEFT JOIN swsCompanyScore s on c.id = s.company_id
      WHERE 1=1
    `;

    const params = [];
    
    // If prices are included, join with price data
    if (includePrices) {
      baseQuery = `
        SELECT c.id, c.ticker_symbol, c.name, c.exchange_symbol, s.total, p.price, p.date
        FROM swsCompany c 
        LEFT JOIN swsCompanyScore s on c.id = s.company_id
        LEFT JOIN (
          SELECT company_id, price, date
          FROM swsCompanyPriceClose
          WHERE date >= ? AND date <= ?
        ) p on c.id = p.company_id
        WHERE 1=1
      `;
      params.push(startDate, endDate);
    }
    
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

    // Debugging output
    logger.debug(`
      DB QUERY:\n===========================
      Parameters:\t${params}
      Sorting by:\t${sortBy}
      SQL:\t${baseQuery}
    `);

    // Query DB and generate output
    const companies = db.query(baseQuery, params);
   
    if (includePrices) {
      const companyIds = companies.map(c => c.id);
      if (companyIds.length === 0) {
        return { data: [] }; // No companies found
      }

      const priceQuery = `
        SELECT company_id, price, date
        FROM swsCompanyPriceClose
        WHERE company_id IN (${companyIds.map(() => '?').join(', ')})
          AND date BETWEEN ? AND ?
      `;
      
      // Batch querying
      const priceParams = [...companyIds, startDate, endDate];
      const prices = db.query(priceQuery, priceParams);

      // Group prices by company ID
      const companiesWithPrices = companies.reduce((acc, company) => {
        const { id, ticker_symbol, name, exchange_symbol, total } = company;
        if (!acc[id]) {
          acc[id] = {
            id,
            ticker_symbol,
            name,
            exchange_symbol,
            total,
            prices: []
          };
        }
        return acc;
      }, {});

      // Populate prices for each company
      prices.forEach(({ company_id, price, date }) => {
        if (companiesWithPrices[company_id]) {
          companiesWithPrices[company_id].prices.push({ price, date });
        }
      });

      // Calculate volatility for each company
      const result = Object.values(companiesWithPrices).map(company => ({
        ...company,
        volatility: calculateVolatility(company.prices),
      }));
      
      // Sort by volatility if needed
      if (sortBy === 'volatility') {
        result.sort((a, b) => (sortOrder === 'asc' ? a.volatility - b.volatility : b.volatility - a.volatility));
      }

      return {
        data: result
      };
    } else {
      // Remove prices if not needed
      return {
        data: companies
      };
    }
  } catch (error) {
    logger.error('Error fetching all tickers info', error);
    throw new Error('Failed to retrieve all tickers information');
  }
}

module.exports = {
  getAllTickersInfo,
  getTickerInfo,
  getTickerInfoWithClose,
  getTickerScore
};
