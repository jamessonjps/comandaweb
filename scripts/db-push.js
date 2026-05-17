const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Carregar variáveis do .env.local manualmente para evitar dependências extras
const envPath = path.join(__dirname, '..', '.env.local');
let dbPassword = '';
let dbUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('SUPABASE_DB_PASSWORD=')) {
      dbPassword = trimmed.split('=')[1].replace(/['"]/g, '').trim();
    } else if (trimmed.startsWith('SUPABASE_DB_URL=')) {
      dbUrl = trimmed.split('=')[1].replace(/['"]/g, '').trim();
    }
  }
}

if (!dbUrl && !dbPassword) {
  console.error("❌ ERRO: Nenhuma credencial do Supabase encontrada no seu arquivo .env.local.");
  console.log("\nPor favor, adicione uma das seguintes variáveis no seu arquivo .env.local:");
  console.log("SUPABASE_DB_URL=sua_connection_string_do_painel_do_supabase");
  console.log("ou");
  console.log("SUPABASE_DB_PASSWORD=sua_senha_do_banco\n");
  process.exit(1);
}

// Se não há uma URL direta mas temos a senha, construímos a URL direta padrão
if (!dbUrl) {
  const encodedPassword = encodeURIComponent(dbPassword);
  dbUrl = `postgresql://postgres:${encodedPassword}@db.inqgwyfkyokodqeckizv.supabase.co:6543/postgres`;
}

try {
  console.log("🚀 Iniciando envio de migrações locais para o banco de dados remoto do Supabase...");
  execSync(`npx supabase db push --db-url "${dbUrl}"`, { stdio: 'inherit' });
  console.log("✅ Migrações aplicadas com sucesso!");
} catch (error) {
  console.error("❌ Erro ao enviar migrações.");
  process.exit(1);
}
