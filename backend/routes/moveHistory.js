const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [moves] = await pool.query(`
      SELECT mh.*, p.name AS product_name, p.sku AS product_sku
      FROM move_history mh
      JOIN products p ON mh.product_id = p.id
      ORDER BY mh.created_at DESC
    `);
    res.json(moves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;