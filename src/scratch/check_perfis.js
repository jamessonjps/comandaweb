
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://inqgwyfkyokodqeckizv.supabase.co';
const supabaseKey = 'sb_publishable_rfDII-pLRl1PzqQNjyJgyg_EzkxabR_';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPerfis() {
  console.log('Checking profiles...');
  const { data, error } = await supabase.from('perfis').select('nome, nivel_acesso, pin_hash');
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles found:', data);
  }
}

checkPerfis();
