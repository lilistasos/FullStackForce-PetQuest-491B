const pool = require('./src/database');
require('dotenv').config({ path: '../.env' });

async function checkDatabase() {
  try {
    console.log('Checking database connection...\n');
    
    // Test connection
    const client = await pool.connect();
    console.log('Successfully connected to database!\n');
    
    // List all tables
    console.log('Tables in database:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('  WARNING: No tables found in the database.\n');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
      console.log('');
    }
    
    // Show row counts for each table
    if (tablesResult.rows.length > 0) {
      console.log('Row counts:');
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}";`);
        const count = countResult.rows[0].count;
        console.log(`  ${tableName}: ${count} rows`);
      }
      console.log('');
    }
    
    // Show sample data from each table (first 5 rows)
    if (tablesResult.rows.length > 0) {
      console.log('Sample data (first 5 rows from each table):');
      console.log('-'.repeat(60));
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 5;`);
        
        if (sampleResult.rows.length > 0) {
          console.log(`\n${tableName.toUpperCase()}:`);
          console.log(JSON.stringify(sampleResult.rows, null, 2));
        } else {
          console.log(`\n${tableName.toUpperCase()}: (empty)`);
        }
        console.log('-'.repeat(60));
      }
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error checking database:');
    console.error(error.message);
    if (error.message.includes('DATABASE_URL')) {
      console.error('\nTIP: Make sure you have a .env file with DATABASE_URL set.');
      console.error('   Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
    }
    process.exit(1);
  }
}

checkDatabase();

