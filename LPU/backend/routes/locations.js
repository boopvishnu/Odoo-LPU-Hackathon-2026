const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');

// GET all locations (with warehouse info joined in)
router.get('/', async (req, res) => {
  try {
    const [locations] = await pool.query(`
      SELECT l.*, w.short_code AS warehouse_code, w.name AS warehouse_name
      FROM locations l
      JOIN warehouses w ON l.warehouse_id = w.id
    `);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new location
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Location name is required'),
    body('short_code').trim().notEmpty().withMessage('Short code is required'),
    body('warehouse_id').isInt().withMessage('A valid warehouse must be selected')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, short_code, warehouse_id } = req.body;

    try {
      const [result] = await pool.query(
        'INSERT INTO locations (name, short_code, warehouse_id) VALUES (?, ?, ?)',
        [name, short_code, warehouse_id]
      );
      res.status(201).json({ id: result.insertId, name, short_code, warehouse_id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT update a location
router.put('/:id', async (req, res) => {
  const { name, short_code, warehouse_id } = req.body;
  try {
    await pool.query(
      'UPDATE locations SET name = COALESCE(?, name), short_code = COALESCE(?, short_code), warehouse_id = COALESCE(?, warehouse_id) WHERE id = ?',
      [name, short_code, warehouse_id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;