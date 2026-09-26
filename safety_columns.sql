-- Run this once in MySQL Workbench, on the vhat_stocksense schema.
-- Safe to run even if columns already exist (uses IF NOT EXISTS, MySQL 8+).
ALTER TABLE operations ADD COLUMN IF NOT EXISTS adjustment_recorded_qty INT NULL;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS adjustment_counted_qty INT NULL;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS adjustment_difference INT NULL;
