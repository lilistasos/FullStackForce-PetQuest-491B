const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL is not set in your .env file');
    console.error('\nPlease create a .env file in the backend directory with:');
    console.error('DATABASE_URL=postgresql://username:password@localhost:5432/database_name');
    console.error('\nExample:');
    console.error('DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/petquest');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'src', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Reading schema file...');
    console.log('🚀 Creating tables...\n');

    // Execute the schema SQL
    await client.query(schemaSQL);

    console.log('✅ All tables created successfully!\n');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    client.release();
    await pool.end();
    console.log('\n✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(error.message);
    
    if (error.message.includes('ENOENT')) {
      console.error('\nTIP: Make sure schema.sql exists in src/ directory');
    } else if (error.message.includes('connection')) {
      console.error('\nTIP: Check your DATABASE_URL and make sure PostgreSQL is running');
    }
    
    process.exit(1);
  }
}

setupDatabase();

