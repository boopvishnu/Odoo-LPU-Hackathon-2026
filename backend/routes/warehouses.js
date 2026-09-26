const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');

// GET all warehouses
router.get('/', async (req, res) => {
  try {
    const [warehouses] = await pool.query('SELECT * FROM warehouses');
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new warehouse
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Warehouse name is required'),
    body('short_code').trim().notEmpty().withMessage('Short code is required').isLength({ max: 10 }).withMessage('Short code too long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, short_code, address } = req.body;

    try {
      const [result] = await pool.query(
        'INSERT INTO warehouses (name, short_code, address) VALUES (?, ?, ?)',
        [name, short_code, address || null]
      );
      res.status(201).json({ id: result.insertId, name, short_code });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A warehouse with this short code already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT update a warehouse
router.put('/:id', async (req, res) => {
  const { name, short_code, address } = req.body;
  try {
    await pool.query(
      'UPDATE warehouses SET name = COALESCE(?, name), short_code = COALESCE(?, short_code), address = ? WHERE id = ?',
      [name, short_code, address || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A warehouse with this short code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;