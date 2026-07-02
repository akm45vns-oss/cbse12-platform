import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const tables = ['user_streaks', 'user_performance_metrics', 'weekly_rankings'];
  for (const table of tables) {
    console.log(`Checking columns for: ${table}`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error querying ${table}:`, error.message);
    } else {
      console.log(`Row keys (columns):`, data.length > 0 ? Object.keys(data[0]) : 'No data in table');
    }
  }
}
main().catch(console.error);
