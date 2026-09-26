const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
// Routes
const productRoutes = require('./routes/products');
const warehouseRoutes = require('./routes/warehouses');
const locationRoutes = require('./routes/locations');
const operationRoutes = require('./routes/operations');
const moveHistoryRoutes = require('./routes/moveHistory');

app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/move-history', moveHistoryRoutes);

app.get('/', (req, res) => {
  res.send('VHAT StockSense API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
