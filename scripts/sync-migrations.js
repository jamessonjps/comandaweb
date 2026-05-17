const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env.local');
let dbUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('SUPABASE_DB_URL=')) {
      dbUrl = trimmed.split('=')[1].replace(/['"]/g, '').trim();
    }
  }
}

if (!dbUrl) {
  console.error("❌ ERRO: A variável SUPABASE_DB_URL não foi encontrada no arquivo .env.local.");
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

const versions = [
  '20240516000000', '20240516000001', '20240516000002', '20240516000003',
  '20240516000004', '20240516000005', '20240516000006', '20240516000007',
  '20240516000008', '20240516000009', '20240516000010', '20240516000011',
  '20240516000012', '20240516000013', '20240516000014', '20240517000000',
  '20240517000001', '20240517000002'
];

async function sync() {
  try {
    console.log("🔗 Conectando ao banco de dados remoto...");
    await client.connect();
    
    console.log("📦 Garantindo existência do esquema de controle do Supabase...");
    await client.query("CREATE SCHEMA IF NOT EXISTS supabase_migrations");
    await client.query(`
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version varchar PRIMARY KEY
      )
    `);

    console.log("📝 Registrando histórico de migrações anteriores como aplicadas...");
    for (const version of versions) {
      await client.query(
        "INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING",
        [version]
      );
    }
    
    console.log("✅ Histórico de migrações sincronizado com sucesso no Supabase!");
  } catch (error) {
    console.error("❌ Erro ao sincronizar histórico de migrações:", error.message);
  } finally {
    await client.end();
  }
}

sync();
