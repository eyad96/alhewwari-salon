import pg from 'pg';
import fs from 'fs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sqlPath = 'c:/Users/eyadh/Desktop/ReactAiAgent/salon-alhewwari/frontend/vite-project/supabase_new_project_complete_setup.sql';

console.log('Reading SQL script from:', sqlPath);
let sqlContent;
try {
  sqlContent = fs.readFileSync(sqlPath, 'utf8');
} catch (err) {
  console.error('Failed to read SQL file:', err);
  process.exit(1);
}

const host = 'aws-0-ap-northeast-1.pooler.supabase.com';
const user = 'postgres.gawzuxjwqbtzomxlbqnl';
const password = 'Eyad**1996**Eyad';
const database = 'postgres';

async function tryPort(port) {
  console.log(`Connecting to ${host} on port ${port} using config object...`);
  const client = new pg.Client({
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log(`Connected successfully on port ${port}! Running SQL setup...`);
    await client.query(sqlContent);
    console.log('🎉 SUCCESS: Database tables, RPC functions, views, and secure RLS policies created successfully!');
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed for port ${port}: ${err.message}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const success6543 = await tryPort(6543);
  if (success6543) process.exit(0);

  const success5432 = await tryPort(5432);
  if (success5432) process.exit(0);

  console.error('❌ ERROR: Could not connect on either port. Please double-check if database password or configuration has changed.');
  process.exit(1);
}

run();
