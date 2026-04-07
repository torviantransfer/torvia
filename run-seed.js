const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Usage: DATABASE_URL=postgresql://... node run-seed.js
const client = new Client({
  connectionString: process.env.DATABASE_URL || '',
  ssl: { rejectUnauthorized: false }
});
if (!process.env.DATABASE_URL) { console.error('Set DATABASE_URL env var'); process.exit(1); }

async function run() {
  await client.connect();
  console.log('Connected to DB');

  // Check existing tables
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  // Check if regions table exists and row count
  try {
    const count = await client.query('SELECT count(*) FROM regions');
    console.log('Existing regions:', count.rows[0].count);
  } catch (e) {
    console.log('regions table does not exist yet, running initial schema...');
    const schema = fs.readFileSync(
      path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql'),
      'utf8'
    );
    await client.query(schema);
    console.log('Initial schema created');
  }

  // Run seed
  try {
    const seed = fs.readFileSync(
      path.join(__dirname, 'supabase', 'migrations', '002_seed_regions.sql'),
      'utf8'
    );
    await client.query(seed);
    const afterCount = await client.query('SELECT count(*) FROM regions');
    console.log('Regions after seed:', afterCount.rows[0].count);
  } catch (e) {
    console.error('Seed error:', e.message);
  }

  await client.end();
}

run().catch(e => { console.error(e.message); client.end(); });
