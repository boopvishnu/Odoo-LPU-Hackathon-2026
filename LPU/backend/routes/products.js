const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');

// GET all products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new product — with real server-side validation
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('unit_of_measure').isIn(['pcs', 'kg', 'box', 'meter', 'set', 'unit']).withMessage('Invalid unit of measure'),
    body('per_unit_cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('on_hand_qty').isInt({ min: 0 }).withMessage('Quantity must be zero or more')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, sku, category, unit_of_measure, per_unit_cost, on_hand_qty, min_threshold } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO products (name, sku, category, unit_of_measure, per_unit_cost, on_hand_qty, free_to_use_qty, min_threshold)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, sku, category || null, unit_of_measure, per_unit_cost, on_hand_qty, on_hand_qty, min_threshold || 10]
      );
      res.status(201).json({ id: result.insertId, name, sku });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A product with this SKU already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT update a product
router.put('/:id', async (req, res) => {
  const { name, sku, category, unit_of_measure, per_unit_cost, on_hand_qty, free_to_use_qty, min_threshold } = req.body;
  try {
    await pool.query(
      `UPDATE products SET
        name = COALESCE(?, name), sku = COALESCE(?, sku), category = ?,
        unit_of_measure = COALESCE(?, unit_of_measure), per_unit_cost = COALESCE(?, per_unit_cost),
        on_hand_qty = COALESCE(?, on_hand_qty), free_to_use_qty = COALESCE(?, free_to_use_qty),
        min_threshold = ?
       WHERE id = ?`,
      [name, sku, category || null, unit_of_measure, per_unit_cost, on_hand_qty, free_to_use_qty, min_threshold ?? null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A product with this SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT set a product's on-hand stock directly (manual count correction)
router.put('/:id/stock', async (req, res) => {
  const { on_hand_qty } = req.body;
  if (on_hand_qty == null || isNaN(Number(on_hand_qty))) {
    return res.status(400).json({ error: 'on_hand_qty must be a number' });
  }
  try {
    await pool.query(
      'UPDATE products SET on_hand_qty = ?, free_to_use_qty = ? WHERE id = ?',
      [on_hand_qty, on_hand_qty, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;