// Script to create the tasks table in the database
const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function setupTasksTable() {
  try {
    const sqlPath = path.join(__dirname, 'create-tasks-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Creating tasks table...');
    await pool.query(sql);
    console.log('✅ Tasks table created successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tasks table:', error);
    process.exit(1);
  }
}

setupTasksTable();

