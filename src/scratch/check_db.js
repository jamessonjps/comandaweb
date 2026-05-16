
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://inqgwyfkyokodqeckizv.supabase.co';
const supabaseKey = 'sb_publishable_rfDII-pLRl1PzqQNjyJgyg_EzkxabR_';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking tables...');
  
  // We can't directly query pg_catalog with anon key usually, but we can try to select from expected tables
  const { data: produtos, error: pError } = await supabase.from('produtos').select('*').limit(1);
  console.log('Produtos table exists:', !pError);
  if (!pError && produtos.length > 0) {
    console.log('Sample Produto:', produtos[0]);
  }

  const { data: estoque, error: eError } = await supabase.from('estoque').select('*').limit(1);
  console.log('Estoque table exists:', !eError);
  if (!eError && estoque.length > 0) {
    console.log('Sample Estoque:', estoque[0]);
  }
}

checkSchema();
