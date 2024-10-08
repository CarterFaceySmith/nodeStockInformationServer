<h3 align="center">nodeStockInformationServer (NSIS)</h3>
<br>
<p align="center"><i>Stock Information API Server</i></p>

## About The Project

NSIS is a Node.js application built using Express and designed to provide stock market information from a local database via a RESTful API. 

This server enables users to retrieve company stock data from a three table local database, including;
- Historical prices
- Simply Wall St snowflake scores
- Company identity data
- Volatility
- ...and other relevant metrics.

The API supports various query parameters for filtering, sorting, and basic pagination. It also includes a basic frontend for experimentation, this can be improved upon but this is a server repo after all.

The API has a local logger using [Winston](https://github.com/winstonjs/winston) which runs according to the standard severity levels specified by [RFC5424](https://tools.ietf.org/html/rfc5424). 

By default it will log only info level events, these are logged to the console and the `combined.log` file found in the project root directory.

## Getting Started

To get started with NSIS, follow these steps:

### Prerequisites

- **Node.js**: Ensure that you have [Node.js](https://nodejs.org/) installed on your machine. This project has been tested with Node.js version 22.5.1.
- **SQLite3**: This project uses SQLite3 as the database. Make sure you have [SQLite3](https://www.sqlite.org/index.html) installed.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/CarterFaceySmith/nodeStockInformationServer.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd nodeStockInformationServer
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up the database:**

   Ensure the database is correctly set up in `services/db`. A preliminary public database of basic stock data is provided for use in sqlite3 format.

5. **Start the server:**

   Production Server:
   ```bash
   npm run start
   ```

   Development Server:
   ```bash
   npm run start:dev
   ```

   Run Tests:
   ```bash
   npm test // Runs tests manually
   npm run test:watch // Run tests with nodemon to auto-rerun on file changes
   ```

   By default, the server will start on port `3000`. You can change the port by setting the `PORT` environment variable.

   A basic frontend implementation has been merged in and can be found at the base route `localhost:<Your port>`.

### API Endpoints

The server exposes several endpoints to interact with stock data. Below are examples of how to use `curl` to test each endpoint.

#### 1. **GET `/stocks`**

- **Basic Request**: Retrieves the first page of stocks.
  ```bash
  curl -X GET "http://localhost:3000/stocks"
  ```

- **Include Prices**: Retrieves the first page of stocks and includes historical prices.
  ```bash
  curl -X GET "http://localhost:3000/stocks?includePrices=true"
  ```

- **Filter by Exchange Symbol**: Retrieves stocks from a specific exchange symbol.
  ```bash
  curl -X GET "http://localhost:3000/stocks?exchangeSymbol=NYSE"
  ```

- **Filter by Minimum Score Total**: Retrieves stocks with a minimum score total of 15.
  ```bash
  curl -X GET "http://localhost:3000/stocks?minScoreTotal=15"
  ```

- **Sort by Score in Descending Order**: Retrieves the first page of stocks sorted by score in descending order.
  ```bash
  curl -X GET "http://localhost:3000/stocks?sortBy=score&sortOrder=desc"
  ```

- **Specify Time Interval Days**: Retrieves stocks with a time range of 30 days for price data.
  ```bash
  curl -X GET "http://localhost:3000/stocks?timeIntervalDays=30"
  ```
  
#### 2. **GET `/stocks/:ticker`**

- **Retrieve Information for a Ticker**: Retrieves information for the ticker `AAPL`.
  ```bash
  curl -X GET "http://localhost:3000/stocks/AAPL"
  ```

- **Include All Historical Prices**: Retrieves information for the ticker `AAPL` and includes all historical prices.
  ```bash
  curl -X GET "http://localhost:3000/stocks/AAPL?getAllPrices=true"
  ```

#### 3. **GET `/stocks/:ticker/score`**

- **Retrieve Score for a Ticker**: Retrieves the score for the ticker `AAPL`.
  ```bash
  curl -X GET "http://localhost:3000/stocks/AAPL/score"
  ```

#### 4. **A More Complex Example**

- Retrieves only stocks listed on the NYSE, with a minimum snowflake total of 15, sorted by that score in descending order and including all historical price data
  ```bash
  curl -X GET "http://localhost:3000/stocks?includePrices=true&exchangeSymbol=NYSE&minScoreTotal=15&sortBy=score&sortOrder=desc"
  ```
  
## Configuration and Testing

### Configuration

The project uses a `config.js` file to manage various configuration settings through environment variables. The configuration file, located at `./config.js`, includes the following environment default variables:
- `listPerPage`: Defines the number of items to display per page. It defaults to 15 if not specified in the environment variables.
- `requestRateLimit`: Sets the maximum number of requests allowed. It defaults to 100 if not specified in the environment variables.

Proposed configs:
- `redisPort`: Sets the server port for your Redis instance if you have configured the commented code in.
- `cacheDuration`: Defines the length of time in seconds to hold cached query data for in your configured Redis instance.
- `secretKey`: Set the secret key variable of your Redis instance if configured.

You can use `export <ENV VAR NAME>=X` to customise these before starting the application.

## Testing

To ensure the functionality of your application, you can run tests using mocha and node assert. The test scripts can be run using the following commands:

Run Tests:
Executes the test suite.
```bash
npm test
```

Run Tests with Nodemon:
If you are using nodemon for development, you can still run tests with mocha. To do so, use the following command, which will watch for changes and rerun the tests when they are made:

```bash
npm run test:watch
```

## Potential Improvements

- In-memory server-side caching via implementation of Redis.
- More robust error handling
- Customising the rate limiting on a per route basis
- Reimplementation of pagination for a larger database
- Improved security measures
- Indexing of the database prior to querying
- Potential refactoring of the database joins to be more efficient in querying (i.e. use of INNER JOIN over LEFT JOIN may improve efficiency of querying)
- Deployment as an isolated microservice
- Improvements to the functionality and design of the frontend generally

## Further Notes Regarding Caching

Redis caching would dramatically boost efficiency as this database grows. Instead of every query hitting the database, which takes an average of 4.1ms per current testing, Redis could serve cached data in under 1ms handidly. This shift means that with a good cache hit rate (say 80%), the effective query time could drop to around 1.4ms. This not only speeds up response times but also eases the load on the database, improving scalability as the volume of stored stock data grows, just as it would in a real-world use case.

A preliminary implementation/scaffolding of this is already in place within the repository, and the redis secret key is configurable as an environment variable, but redis is not active by default due to outstanding bugs and potential overengineering for the sample database size.

## Notes

If you encounter any issues or have suggestions, please feel free to log an issue on the [GitHub repository](https://github.com/CarterFaceySmith/nodeStockInformationServer) or [contact me](mailto:carterfs@proton.me).

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.
