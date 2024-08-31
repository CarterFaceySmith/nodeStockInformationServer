const winston = require('winston');
const moment = require('moment');

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  const formattedTime = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  return `${formattedTime} [${level}]: ${message}`;
});

/* Default Winston logging levels
 * error: 0
 * warn: 1
 * info: 2
 * http: 3
 * verbose: 4
 * debug: 5
 * silly: 6
 */

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
