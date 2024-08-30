const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const stocksRouter = require('./routes/stocks');

app.get('/', (req, res) => {
  res.json({message: 'Stock server active.'});
});

app.use('/stocks', stocksRouter);

app.listen(port, () => {
  console.log('Stocker information server listening at http://localhost:${port}');
});
