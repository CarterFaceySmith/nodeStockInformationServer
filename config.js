const env = process.env;

const config = {
  listPerPage: env.LIST_PER_PAGE || 15,
}

module.exports = config;
