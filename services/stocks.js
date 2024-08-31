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
      'SELECT date, price FROM swsCompanyPriceClose WHERE company_id = ? AND date >= ? ORDER BY date ASC',
      [data.id, moment().subtract(config.chartingInterval, 'days').format('YYYY-MM-DD')]
    ]
  : [
      'SELECT date, price FROM swsCompanyPriceClose WHERE company_id = ? ORDER BY date DESC LIMIT 1',
      [data.id]
    ];
  
  logger.info(`query: ${query}`);
  logger.info(`query params: ${queryParams}`);
  
  const closeData = db.query(query, queryParams);
  logger.info(`returned close data: ${closeData}`);
  return {
    data,
    closeData: getAllPrices ? closeData : closeData[0] || null
    // Note: Potentially overengineered for this task but closeData has been made extensible and compatible with common time series formatting in charting libs.
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
  if (data) {
    const query = 'SELECT * FROM swsCompanyScore WHERE id = ?';
    const scoreData = db.query(query, [data.score_id]); // Assuming companies score_id are unique
    return {
      data,
      scoreData: scoreData[0] || null // Again, there should only be one entry here but still worth a check
    }
  }

  else {
    return { data: null, scoreData: null };
  }
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
function getAllTickersInfo(page = 1, includePrices = false) {
  const offset = (page - 1) * config.listPerPage;
  const query = 'SELECT * FROM swsCompany LIMIT ? OFFSET ?';
  const companies = db.query(query, [config.listPerPage, offset]);
 
  logger.debug(`offset: ${offset}, limit: ${config.listPerPage}`);
  logger.debug(`query: ${query}`);
  logger.debug(`companies: ${companies}`);

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
  getTickerInfo,
  getTickerInfoWithClose,
  getTickerScore
}
