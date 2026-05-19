import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gawzuxjwqbtzomxlbqnl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhd3p1eGp3cWJ0em9teGxicW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA4MjAyMCwiZXhwIjoyMDk0NjU4MDIwfQ.OVdutwRXLiPtpXzR7T9PkSU9mc1w-vjdciTQDNf-IAk'; // Service role key to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching a single profile to inspect its keys...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching profile:', error);
  } else {
    console.log('Successfully fetched profile keys:', data);
  }
}

run();
