const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    
    console.log('Reading migration file...');
    const sql = fs.readFileSync(path.join(__dirname, 'supabase/migrations/0000_initial_schema.sql'), 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    
    console.log('Migration executed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await client.end();
  }
}

runMigration();
