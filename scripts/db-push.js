const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Carregar variáveis do .env.local manualmente para evitar dependências extras
const envPath = path.join(__dirname, '..', '.env.local');
let dbPassword = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('SUPABASE_DB_PASSWORD=')) {
      dbPassword = trimmed.split('=')[1].replace(/['"]/g, '').trim();
    }
  }
}

if (!dbPassword) {
  console.error("❌ ERRO: A variável SUPABASE_DB_PASSWORD não foi encontrada no seu arquivo .env.local.");
  console.log("\nPor favor, adicione a senha do banco de dados no seu arquivo .env.local desta forma:");
  console.log("SUPABASE_DB_PASSWORD=sua_senha_do_banco\n");
  process.exit(1);
}

// Percent-encode the password to handle special characters (e.g. @, #, $, etc.) safely in the URL connection string
const encodedPassword = encodeURIComponent(dbPassword);
const dbUrl = `postgresql://postgres:${encodedPassword}@db.inqgwyfkyokodqeckizv.supabase.co:6543/postgres`;

try {
  console.log("🚀 Iniciando envio de migrações locais para o banco de dados remoto do Supabase...");
  execSync(`npx supabase db push --db-url "${dbUrl}"`, { stdio: 'inherit' });
  console.log("✅ Migrações aplicadas com sucesso!");
} catch (error) {
  console.error("❌ Erro ao enviar migrações.");
  process.exit(1);
}
