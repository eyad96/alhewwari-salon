import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const host = 'db.gawzuxjwqbtzomxlbqnl.supabase.co';
const user = 'postgres';
const password = 'Eyad**1996**Eyad';
const database = 'postgres';
const port = 5432;

async function checkDb() {
  const client = new pg.Client({
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to DB!');

    // 1. Query columns in public.profiles
    const resProfiles = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles';
    `);
    console.log('\n--- public.profiles Columns ---');
    resProfiles.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // 2. Query columns in public.bookings
    const resBookings = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bookings';
    `);
    console.log('\n--- public.bookings Columns ---');
    resBookings.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // 3. Check if public.appointments view exists and get its definition
    const resView = await client.query(`
      SELECT definition 
      FROM pg_views 
      WHERE schemaname = 'public' AND viewname = 'appointments';
    `);
    console.log('\n--- public.appointments View Definition ---');
    if (resView.rows.length > 0) {
      console.log(resView.rows[0].definition);
    } else {
      console.log('View "public.appointments" does NOT exist!');
    }

    await client.end();
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
}

checkDb();
