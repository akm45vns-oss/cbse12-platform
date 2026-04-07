import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({path: path.resolve(process.cwd(), '.env.local')});
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  console.log('Checking database count...');
  
  // Method 1: Count with exact flag
  const { count, error } = await s
    .from('quiz_sets')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log('❌ Count query error:', error.message);
  } else {
    console.log('✅ Supabase count (exact): ' + count);
  }
  
  // Method 2: Manual count by fetching all IDs
  let manual = 0;
  let from = 0;
  while (true) {
    const { data } = await s
      .from('quiz_sets')
      .select('id')
      .range(from, from + 4999);
    
    if (!data || data.length === 0) break;
    manual += data.length;
    from += 5000;
  }
  console.log('✅ Manual count (pagination): ' + manual);
  
  console.log('\n📊 Final Answer: ' + Math.max(count || 0, manual) + ' / 1,454');
})();
