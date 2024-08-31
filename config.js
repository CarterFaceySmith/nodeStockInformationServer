const env = process.env;

const config = {
  listPerPage: env.LIST_PER_PAGE || 15,
  chartingInterval: env.CHARTING_INTERVAL || 90,
}

module.exports = config;
