<h3 align="center">nodeStockInformationServer</h3>
<br>
<p align="center"><i>Stock Information API Server</i></p>

## About The Project

The `nodeStockInformationServer` is a Node.js application built using Express and designed to provide stock market information from a local database via a RESTful API. 

This server enables users to retrieve company stock data from a three table local database, including;
- Historical prices
- Simply Wall St snowflake scores
- Volatility
- ...and other relevant metrics.

The API supports various query parameters for filtering, sorting, and basic pagination.

## Getting Started

To get started with the `nodeStockInformationServer`, follow these steps:

### Prerequisites

- **Node.js**: Ensure that you have [Node.js](https://nodejs.org/) installed on your machine. This project has been tested with Node.js version 22.5.1.
- **SQLite3**: This project uses SQLite3 as the database. Make sure you have [SQLite3](https://www.sqlite.org/index.html) installed.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/nodeStockInformationServer.git
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
   npm start
   ```

   Development Server:
   ```bash
   npm run start:dev
   ```

   By default, the server will start on port `3000`. You can change the port by setting the `PORT` environment variable.

### API Endpoints

The server exposes several endpoints to interact with stock data. Below are examples of how to use `curl` to test each endpoint.

#### 1. **GET `/stocks`**

- **Basic Request**: Retrieves the first page of stocks.
  ```bash
  curl -X GET "http://localhost:3000/stocks"
  ```

- **Request with Pagination**: Retrieves the second page of stocks if it exists.
  ```bash
  curl -X GET "http://localhost:3000/stocks?page=2"
  ```

- **Include Prices**: Retrieves the first page of stocks and includes historical prices.
  ```bash
  curl -X GET "http://localhost:3000/stocks?includePrices=true"
  ```

- **Filter by Exchange Symbol**: Retrieves stocks from a specific exchange symbol.
  ```bash
  curl -X GET "http://localhost:3000/stocks?exchangeSymbol=NASDAQ"
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

#### 2. **GET `/stocks/prevStocks`**

- **Basic Request**: Retrieves the first page of previous stocks.
  ```bash
  curl -X GET "http://localhost:3000/stocks/prevStocks"
  ```

- **Include Prices**: Retrieves the first page of previous stocks with price data.
  ```bash
  curl -X GET "http://localhost:3000/stocks/prevStocks?includePrices=true"
  ```

- **Request with Pagination**: Retrieves the second page of previous stocks.
  ```bash
  curl -X GET "http://localhost:3000/stocks/prevStocks?page=2"
  ```

#### 3. **GET `/stocks/:ticker`**

- **Retrieve Information for a Ticker**: Retrieves information for the ticker `AAPL`.
  ```bash
  curl -X GET "http://localhost:3000/stocks/AAPL"
  ```

- **Include All Historical Prices**: Retrieves information for the ticker `AAPL` and includes all historical prices.
  ```bash
  curl -X GET "http://localhost:3000/stocks/AAPL?getAllPrices=true"
  ```

#### 4. **GET `/stocks/:ticker/score`**

- **Retrieve Score for a Ticker**: Retrieves the score for the ticker `AAPL`.
  ```bash
  curl -X GET "http://localhost:3000/stocks/AAPL/score"
  ```

## Notes

If you encounter any issues or have suggestions, please feel free to log an issue on the [GitHub repository](https://github.com/yourusername/nodeStockInformationServer) or [contact me](mailto:carterfs@proton.me).

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.
