const db = require('./db');
const config = require('../config');

function getTickerInfo(ticker) {
  const data = db.query('SELECT * FROM swsCompany WHERE ticker_symbol = ?', [ticker])// Syncronous query via better-sqlite3
  return data[0]; // Assuming unique ticker_symbol
}

function getTickerInfoWithClose(ticker) {
  const data = getTickerInfo(ticker);
  if (data) {
    const query = 'SELECT * FROM swsCompanyPriceClose WHERE company_id = ? ORDER BY date DESC LIMIT 1';
    const close = db.query(query, [data.id]);
    return {
      data,
      close: close[0] || null // Should only return a single close or null - we only want the latest price
    };
  }

  else {
    return { data: null, close: null };
  }
}

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

// Return an array of company entities, each company's past share prices as an optional query param
function getAllTickersInfo(page = 1, includePrices = false) {
  const offset = (page - 1) * config.listPerPage;
  const query = 'SELECT * FROM swsCompany LIMIT ? OFFSET ?';
  const companies = db.query(query, [config.listPerPage, offset]);
 
  //console.log(`offset: ${offset}, limit: ${config.listPerPage}`);
  //console.log(`query: ${query}`);
  //console.log(`companies: ${companies}`);

  if (includePrices) {
    const companiesWithPrices = companies.map(company => {
      const priceQuery = 'SELECT * FROM swsCompanyPriceClose WHERE company_id = ? ORDER BY date';
      // Note: This SQL query will not scale well across larger tables and should have a display limit
      const prices = db.query(priceQuery, [company.id]);
      return {
        ...company,
        prices // Returns all past prices for the given company
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
