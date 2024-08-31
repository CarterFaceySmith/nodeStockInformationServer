const sqlite = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/sws.sqlite3');
const db = new sqlite(dbPath, {fileMustExist: true});

function query(sql, params) {
  return db.prepare(sql).all(params);
}

module.exports = {
  query
}
