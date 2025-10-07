const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// DB test
app.get('/dbtest', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).json({ connected: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));