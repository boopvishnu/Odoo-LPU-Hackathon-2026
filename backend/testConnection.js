const pool = require('./db');

async function test() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log('✅ Connected! Tables found:', rows);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

test();