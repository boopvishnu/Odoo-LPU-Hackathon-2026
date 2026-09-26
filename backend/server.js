const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
  res.send('VHAT StockSense API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});