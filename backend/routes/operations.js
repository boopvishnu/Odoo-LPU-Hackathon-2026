const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');

const REF_PREFIX = {
  Receipt: 'IN',
  Delivery: 'OUT',
  Transfer: 'INT',
  Adjustment: 'ADJ'
};

// Generate the next reference like WH/IN/0001
async function generateReference(type) {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM operations WHERE type = ?', [type]);
  const nextNumber = rows[0].count + 1;
  return `WH/${REF_PREFIX[type]}/${String(nextNumber).padStart(4, '0')}`;
}

// GET all operations, with their line items attached
router.get('/', async (req, res) => {
  try {
    const [operations] = await pool.query('SELECT * FROM operations ORDER BY created_at DESC');
    const [lines] = await pool.query(`
      SELECT ol.*, p.name AS product_name, p.sku AS product_sku
      FROM operation_lines ol
      JOIN products p ON ol.product_id = p.id
    `);

    const result = operations.map((op) => ({
      ...op,
      lines: lines.filter((l) => l.operation_id === op.id)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single operation by id, with lines
router.get('/:id', async (req, res) => {
  try {
    const [ops] = await pool.query('SELECT * FROM operations WHERE id = ?', [req.params.id]);
    if (ops.length === 0) return res.status(404).json({ error: 'Operation not found' });

    const [lines] = await pool.query(
      `SELECT ol.*, p.name AS product_name, p.sku AS product_sku
       FROM operation_lines ol JOIN products p ON ol.product_id = p.id
       WHERE ol.operation_id = ?`,
      [req.params.id]
    );

    res.json({ ...ops[0], lines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new operation (status starts as Draft/Waiting/Ready — not yet applied to stock)
router.post(
  '/',
  [
    body('type').isIn(['Receipt', 'Delivery', 'Transfer', 'Adjustment']).withMessage('Invalid operation type'),
    body('schedule_date').isISO8601().withMessage('A valid schedule date (YYYY-MM-DD) is required'),
    body('lines').isArray({ min: 1 }).withMessage('At least one product line is required'),
    body('lines.*.product_id').isInt().withMessage('Each line needs a valid product'),
    body('lines.*.quantity').isInt({ min: 1 }).withMessage('Each line quantity must be at least 1')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type,
      from_location_id,
      from_location_label,
      to_location_id,
      to_location_label,
      contact,
      responsible,
      schedule_date,
      status,
      operation_subtype,
      notes,
      lines
    } = req.body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const reference = await generateReference(type);

      const [result] = await conn.query(
        `INSERT INTO operations
         (reference, type, from_location_id, from_location_label, to_location_id, to_location_label,
          contact, responsible, schedule_date, status, operation_subtype, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reference, type, from_location_id || null, from_location_label || null,
          to_location_id || null, to_location_label || null,
          contact || null, responsible || null, schedule_date,
          status || 'Draft', operation_subtype || null, notes || null
        ]
      );

      const operationId = result.insertId;

      for (const line of lines) {
        await conn.query(
          'INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES (?, ?, ?)',
          [operationId, line.product_id, line.quantity]
        );
      }

      await conn.commit();
      res.status(201).json({ id: operationId, reference });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  }
);

// Helper: add (or subtract) stock at a location, creating the row if it doesn't exist yet
async function adjustLocationStock(conn, productId, locationId, delta) {
  if (!locationId) return; // vendor/customer aren't real locations, skip
  await conn.query(
    `INSERT INTO product_location_stock (product_id, location_id, quantity)
     VALUES (?, ?, GREATEST(0, ?))
     ON DUPLICATE KEY UPDATE quantity = GREATEST(0, quantity + ?)`,
    [productId, locationId, delta, delta]
  );
}

// PUT update an operation's fields + lines (used for editing drafts before validation)
router.put('/:id', async (req, res) => {
  const {
    type,
    from_location_id,
    from_location_label,
    to_location_id,
    to_location_label,
    contact,
    responsible,
    schedule_date,
    status,
    operation_subtype,
    notes,
    adjustment_recorded_qty,
    adjustment_counted_qty,
    adjustment_difference,
    lines
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE operations SET
        type = COALESCE(?, type),
        from_location_id = ?, from_location_label = ?,
        to_location_id = ?, to_location_label = ?,
        contact = ?, responsible = ?, schedule_date = COALESCE(?, schedule_date),
        status = COALESCE(?, status), operation_subtype = ?, notes = ?,
        adjustment_recorded_qty = ?, adjustment_counted_qty = ?, adjustment_difference = ?
       WHERE id = ?`,
      [
        type || null,
        from_location_id || null, from_location_label || null,
        to_location_id || null, to_location_label || null,
        contact || null, responsible || null, schedule_date || null,
        status || null, operation_subtype || null, notes || null,
        adjustment_recorded_qty ?? null, adjustment_counted_qty ?? null, adjustment_difference ?? null,
        req.params.id
      ]
    );

    if (Array.isArray(lines)) {
      await conn.query('DELETE FROM operation_lines WHERE operation_id = ?', [req.params.id]);
      for (const line of lines) {
        await conn.query(
          'INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES (?, ?, ?)',
          [req.params.id, line.product_id, line.quantity]
        );
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// PUT validate an operation — this is where actual stock movement happens
router.put('/:id/validate', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ops] = await conn.query('SELECT * FROM operations WHERE id = ? FOR UPDATE', [req.params.id]);
    if (ops.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Operation not found' });
    }
    const op = ops[0];

    if (op.status === 'Done') {
      await conn.rollback();
      return res.status(400).json({ error: 'Operation is already validated and Done.' });
    }
    if (op.status === 'Canceled') {
      await conn.rollback();
      return res.status(400).json({ error: 'Cannot validate a canceled operation.' });
    }

    const [lines] = await conn.query('SELECT * FROM operation_lines WHERE operation_id = ?', [op.id]);
    const today = new Date().toISOString().split('T')[0];

    if (op.type === 'Receipt') {
      for (const line of lines) {
        await conn.query(
          'UPDATE products SET on_hand_qty = on_hand_qty + ?, free_to_use_qty = free_to_use_qty + ? WHERE id = ?',
          [line.quantity, line.quantity, line.product_id]
        );
        await adjustLocationStock(conn, line.product_id, op.to_location_id, line.quantity);

        await conn.query(
          `INSERT INTO move_history (reference, move_date, contact, from_location, to_location, product_id, quantity, status, direction)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Done', 'in')`,
          [op.reference, today, op.contact, op.from_location_label || 'vendor', op.to_location_label, line.product_id, line.quantity]
        );
      }
    } else if (op.type === 'Delivery') {
      for (const line of lines) {
        await conn.query(
          `UPDATE products
           SET on_hand_qty = GREATEST(0, on_hand_qty - ?), free_to_use_qty = GREATEST(0, free_to_use_qty - ?)
           WHERE id = ?`,
          [line.quantity, line.quantity, line.product_id]
        );
        await adjustLocationStock(conn, line.product_id, op.from_location_id, -line.quantity);

        await conn.query(
          `INSERT INTO move_history (reference, move_date, contact, from_location, to_location, product_id, quantity, status, direction)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Done', 'out')`,
          [op.reference, today, op.contact, op.from_location_label, op.to_location_label || 'customer', line.product_id, line.quantity]
        );
      }
    } else if (op.type === 'Transfer') {
      for (const line of lines) {
        await adjustLocationStock(conn, line.product_id, op.from_location_id, -line.quantity);
        await adjustLocationStock(conn, line.product_id, op.to_location_id, line.quantity);

        await conn.query(
          `INSERT INTO move_history (reference, move_date, contact, from_location, to_location, product_id, quantity, status, direction)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Done', 'internal')`,
          [op.reference, today, op.contact || op.responsible, op.from_location_label, op.to_location_label, line.product_id, line.quantity]
        );
      }
    } else if (op.type === 'Adjustment') {
      const line = lines[0];
      if (line) {
        const [[product]] = await conn.query('SELECT * FROM products WHERE id = ?', [line.product_id]);
        const counted = op.adjustment_counted_qty ?? product.on_hand_qty;
        const diff = counted - product.on_hand_qty;

        await conn.query(
          'UPDATE products SET on_hand_qty = ?, free_to_use_qty = GREATEST(0, free_to_use_qty + ?) WHERE id = ?',
          [counted, diff, line.product_id]
        );

        await conn.query(
          'UPDATE operations SET adjustment_recorded_qty = ?, adjustment_difference = ? WHERE id = ?',
          [product.on_hand_qty, diff, op.id]
        );

        await conn.query(
          `INSERT INTO move_history (reference, move_date, contact, from_location, to_location, product_id, quantity, status, direction)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Done', ?)`,
          [
            op.reference, today, op.contact || 'Stock Audit',
            diff >= 0 ? 'Adjustment' : (op.from_location_label || 'Stock'),
            diff >= 0 ? (op.from_location_label || 'Stock') : 'Adjustment',
            line.product_id, Math.abs(diff), diff >= 0 ? 'in' : 'out'
          ]
        );
      }
    }

    await conn.query("UPDATE operations SET status = 'Done' WHERE id = ?", [op.id]);
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// PUT cancel an operation
router.put('/:id/cancel', async (req, res) => {
  try {
    await pool.query("UPDATE operations SET status = 'Canceled' WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an operation
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM operations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;