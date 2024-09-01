const env = process.env;

const config = {
  listPerPage: env.LIST_PER_PAGE || 15,
  requestRateLimit: env.REQUEST_RATE_LIMIT || 100,
}

module.exports = config;
