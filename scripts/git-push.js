const { execSync } = require('child_process');

// Permite passar uma mensagem de commit personalizada via argumentos
const args = process.argv.slice(2);
let commitMessage = args.join(' ').trim();

try {
  // 1. Obter arquivos modificados
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  
  if (!status) {
    console.log("ℹ️ Nenhum arquivo alterado para realizar o commit.");
    process.exit(0);
  }

  console.log("📂 Arquivos alterados detectados:\n");
  console.log(status);

  // 2. Gerar uma mensagem de commit inteligente se não foi fornecida nenhuma
  if (!commitMessage) {
    const lines = status.split('\n');
    const modifications = [];
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const filePath = parts[parts.length - 1];
      if (filePath.includes('src/app/caixa/')) modifications.push('fluxo de caixa');
      else if (filePath.includes('src/app/cardapio/')) modifications.push('cardápio e estoque');
      else if (filePath.includes('src/app/admin/historico/')) modifications.push('histórico de vendas');
      else if (filePath.includes('supabase/migrations/')) modifications.push('migrations do banco');
      else if (filePath.includes('package.json')) modifications.push('dependências');
      else if (filePath.includes('scripts/')) modifications.push('scripts utilitários');
    });

    const uniqueMods = [...new Set(modifications)];
    if (uniqueMods.length > 0) {
      commitMessage = `feat: atualizar ${uniqueMods.join(', ')}`;
    } else {
      commitMessage = 'chore: atualizar base de código e configurações';
    }
  }

  console.log(`\n📝 Mensagem de commit: "${commitMessage}"`);
  
  console.log("\n📦 Executando: git add .");
  execSync('git add .');

  console.log(`💾 Executando: git commit -m "${commitMessage}"`);
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

  console.log("🚀 Executando: git push");
  execSync('git push');

  console.log("\n✅ Sucesso! Todas as alterações foram commitadas e enviadas para o GitHub remoto.");
} catch (error) {
  console.error("\n❌ Erro durante o fluxo do Git:", error.message);
  process.exit(1);
}
