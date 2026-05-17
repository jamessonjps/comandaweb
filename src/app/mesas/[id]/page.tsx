"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  Receipt, 
  Send, 
  Clock, 
  AlertCircle, 
  User, 
  Phone,
  XCircle,
  MinusCircle,
  Smartphone,
  Trash2,
  Lock,
  MessageCircle
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { useComanda } from '@/hooks/useComanda';
import { useCarrinhoStore } from '@/store/carrinho.store';
import { formatCurrency, formatElapsedTime } from '@/utils/formatters';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export default function ComandaDetalhesPage() {
  const { id: mesaId } = useParams() as { id: string };
  const router = useRouter();
  const { comanda, itens, isLoading, refresh } = useComanda(mesaId);
  const { itens: itensCarrinho, total: totalCarrinho, limparCarrinho } = useCarrinhoStore();
  const user = useAuthStore(state => state.user);

  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [pagamentos, setPagamentos] = useState<{metodo: string, valor: number}[]>([]);
  const [metodoAtual, setMetodoAtual] = useState('dinheiro');
  const [valorAtual, setValorAtual] = useState('');
  const [useTaxa, setUseTaxa] = useState(true);

  // Estados Adicionais
  const [activeShift, setActiveShift] = useState<any>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);
  const [sugestoesClientes, setSugestoesClientes] = useState<any[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  useEffect(() => {
    const checkActiveShift = async () => {
      try {
        const { data } = await supabase
          .from('turnos_caixa')
          .select('*')
          .eq('status', 'aberto')
          .limit(1)
          .maybeSingle();
        setActiveShift(data || null);
      } catch (err) {
        console.error('Erro ao verificar caixa:', err);
      } finally {
        setIsShiftLoading(false);
      }
    };
    checkActiveShift();
  }, []);

  useEffect(() => {
    if (clienteNome.trim().length < 2) {
      setSugestoesClientes([]);
      return;
    }
    const searchClients = async () => {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nome', `%${clienteNome}%`)
        .limit(5);
      setSugestoesClientes((data || []).filter(c => c.nome !== clienteNome));
    };
    const delayDebounce = setTimeout(() => {
      searchClients();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [clienteNome]);

  const totalComTaxa = (comanda?.total_calculado || 0) * (useTaxa ? 1.1 : 1);
  const jaPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const faltaPagar = Math.max(0, totalComTaxa - jaPago);
  const troco = Math.max(0, jaPago - totalComTaxa);

  const handleAuthAction = (action: () => void) => {
    setPendingAction(() => action);
    setShowPinModal(true);
    setPinInput('');
  };

  const verifyPin = () => {
    if (pinInput === '5678') {
      if (pendingAction) pendingAction();
      setShowPinModal(false);
      setPendingAction(null);
    } else {
      alert('PIN INVÁLIDO!');
      setPinInput('');
    }
  };

  const handleAddPagamento = () => {
    const valor = parseFloat(valorAtual);
    if (isNaN(valor) || valor <= 0) return;
    setPagamentos([...pagamentos, { metodo: metodoAtual, valor }]);
    setValorAtual('');
  };

  const handleCancelarItem = async (itemId: string) => {
    handleAuthAction(async () => {
      await supabase.from('itens_pedido').update({ status_item: 'cancelado' }).eq('id', itemId);
      await refresh();
    });
  };

  const handleFinalizarConta = async () => {
    if (jaPago < totalComTaxa - 0.01) { alert(`FALTA RECEBER: ${formatCurrency(faltaPagar)}`); return; }
    setIsActionLoading(true);
    try {
      await supabase.from('pagamentos_comanda').insert(pagamentos.map(p => ({ comanda_id: comanda!.id, metodo: p.metodo, valor: p.valor })));
      await supabase.from('comandas').update({ status: 'paga', fechada_em: new Date().toISOString(), total_pago: totalComTaxa, taxa_servico_inclusa: useTaxa, valor_taxa_servico: useTaxa ? comanda!.total_calculado * 0.1 : 0 }).eq('id', comanda!.id);
      await supabase.from('mesas').update({ status: 'livre' }).eq('id', mesaId);
      alert('MESA FINALIZADA!');
      router.push('/mesas');
    } catch (err: any) { alert('ERRO AO FINALIZAR: ' + err.message); } finally { setIsActionLoading(false); }
  };

  const handleAbrirMesa = async () => {
    if (!user) { alert('REFAÇA O LOGIN.'); return; }
    if (!activeShift) { alert('O CAIXA ESTÁ FECHADO! ABRA O CAIXA PRIMEIRO.'); return; }
    setIsActionLoading(true);
    try {
      let clienteId = selectedClienteId;
      if (!clienteId && clienteNome.trim()) {
        const { data: cliente } = await supabase.from('clientes').insert({ nome: clienteNome, telefone: clienteTelefone, whatsapp: clienteTelefone }).select().maybeSingle();
        if (cliente) clienteId = cliente.id;
      }
      const { error: cErr } = await supabase.from('comandas').insert({ mesa_id: mesaId, garcom_id: user.id, cliente_id: clienteId, status: 'aberta', status_pagamento: 'Pendente' });
      if (cErr) throw cErr;
      await supabase.from('mesas').update({ status: 'ocupada' }).eq('id', mesaId);
      await refresh();
    } catch (err: any) { alert('ERRO AO ABRIR: ' + err.message); } finally { setIsActionLoading(false); }
  };

  const handleEnviarPedido = async () => {
    if (!comanda || itensCarrinho.length === 0 || !user) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.from('itens_pedido').insert(itensCarrinho.map(item => ({ comanda_id: comanda.id, produto_id: item.produto_id, quantidade: item.quantidade, preco_unitario: item.preco_unitario, preco_unitario_congelado: item.preco_unitario, criado_por: user.id })));
      if (error) throw error;
      limparCarrinho();
      await refresh();
    } catch (err: any) { alert('ERRO AO ENVIAR: ' + err.message); } finally { setIsActionLoading(false); }
  };

  const shareWhatsApp = () => {
    if (!comanda) return;
    const subtotal = comanda.total_calculado;
    const taxa = useTaxa ? subtotal * 0.1 : 0;
    const total = subtotal + taxa;

    let texto = `*🌊 MANGUEIRÃO BISTRO 🌊*\n`;
    texto += `*------------------------------*\n`;
    texto += `📝 *CONTA PARCIAL - MESA ${comanda.mesa.numero}*\n`;
    texto += `👤 Cliente: ${comanda.clientes?.nome || 'Mesa Local'}\n`;
    texto += `*------------------------------*\n\n`;
    
    itens.forEach((i: any) => {
      texto += `• ${i.quantidade}x ${i.produto.nome.padEnd(15)} ${formatCurrency(i.preco_unitario_congelado * i.quantidade)}\n`;
    });
    
    texto += `\n*------------------------------*\n`;
    texto += `Subtotal: ${formatCurrency(subtotal)}\n`;
    if (useTaxa) {
      texto += `Taxa de Serviço (10%): ${formatCurrency(taxa)}\n`;
      texto += `_(Opcional)_\n`;
    }
    texto += `*TOTAL: ${formatCurrency(total)}*\n`;
    texto += `*------------------------------*\n\n`;
    texto += `*Obrigado pela preferência!* 😊`;

    const phone = comanda.clientes?.whatsapp || comanda.clientes?.telefone || '';
    if (!phone) {
      alert('ESTA MESA NÃO TEM WHATSAPP CADASTRADO!');
      return;
    }
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-48 font-sans">
      <AppHeader title={comanda ? `Mesa ${comanda.mesa.numero.toString().padStart(2, '0')}` : 'Novo Atendimento'} showUser={false} showBack={true} />

      {/* MODAL DE PIN... (mantido) */}
      {showPinModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-900"><Lock size={20} /></div>
              <div className="flex flex-col items-center text-center">
                <h3 className="text-sm font-black uppercase tracking-widest">Autorização</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">PIN do Gerente para Cancelar</p>
              </div>
              <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full bg-stone-50 border rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-stone-900" autoFocus />
              <div className="grid grid-cols-2 gap-3 w-full">
                 <button onClick={() => { setShowPinModal(false); setPendingAction(null); }} className="py-3 text-[10px] font-bold uppercase text-stone-400 bg-stone-50 rounded-xl">Sair</button>
                 <button onClick={verifyPin} className="py-3 text-[10px] font-bold uppercase text-white bg-stone-900 rounded-xl">Confirmar</button>
              </div>
           </div>
        </div>
      )}

      {showCheckout && comanda && (
        <div className="fixed inset-0 bg-stone-900/95 z-50 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex justify-between items-center text-white"><h2 className="text-xl font-black uppercase tracking-tighter">Mesa {comanda.mesa.numero}</h2><button onClick={() => setShowCheckout(false)}><XCircle size={32} /></button></div>
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
            
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto bg-stone-50 p-3 rounded-2xl border border-stone-100">
               {itens.map(item => (
                 <div key={item.id} className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-stone-600">{item.quantidade}x {item.produto.nome}</span>
                    <div className="flex items-center gap-2">
                       <span>{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                       <button onClick={() => handleCancelarItem(item.id)} className="text-red-500"><Trash2 size={12} /></button>
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex justify-between border-b pb-4"><span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Subtotal</span><span className="font-bold text-lg">{formatCurrency(comanda.total_calculado)}</span></div>
            <div className="flex justify-between items-center py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={useTaxa} onChange={(e) => setUseTaxa(e.target.checked)} className="accent-stone-900" />
                <span className="text-sm font-black uppercase">Taxa 10%</span>
              </label>
              <span className="text-3xl font-black text-stone-900">{formatCurrency(totalComTaxa)}</span>
            </div>
            
            <div className="flex gap-2">
              <select value={metodoAtual} onChange={(e) => setMetodoAtual(e.target.value)} className="flex-1 bg-stone-50 border rounded-xl p-3 text-xs font-bold uppercase"><option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="cartao_debito">C. Débito</option><option value="cartao_credito">C. Crédito</option><option value="fiado">Fiado</option></select>
              <input type="number" placeholder="Valor" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} className="w-24 bg-stone-50 border rounded-xl p-3 text-xs font-bold" />
              <button onClick={handleAddPagamento} className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center"><Plus /></button>
            </div>
            {/* ... (restante do pagamentos) */}
            <div className="flex flex-col gap-1">
              {pagamentos.map((p, i) => (<div key={i} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg text-[10px] font-bold uppercase"><span>{p.metodo}</span><div className="flex items-center gap-2"><span>{formatCurrency(p.valor)}</span><button onClick={() => setPagamentos(pagamentos.filter((_, idx) => idx !== i))} className="text-red-500"><MinusCircle size={14} /></button></div></div>))}
            </div>
            <div className="bg-stone-900 text-white p-5 rounded-2xl flex justify-between items-center mt-2 shadow-xl">
              <div className="flex flex-col"><span className="text-[8px] uppercase opacity-60">Troco</span><span className="text-xl font-black">{troco > 0 ? formatCurrency(troco) : formatCurrency(faltaPagar)}</span></div>
              <button onClick={handleFinalizarConta} disabled={(jaPago < totalComTaxa - 0.01) || isActionLoading} className="bg-white text-stone-900 px-6 py-3 rounded-xl font-bold uppercase text-xs">FINALIZAR</button>
            </div>
            <button onClick={shareWhatsApp} className="w-full py-4 text-[10px] font-black uppercase text-green-600 bg-green-50 rounded-xl flex items-center justify-center gap-2"><MessageCircle size={16} /> ENVIAR CONTA PARCIAL</button>
          </div>
        </div>
      )}
      <main className="px-6 py-4 flex flex-col gap-6">
        {!comanda ? (
          <div className="bistro-card flex flex-col gap-4 animate-in fade-in duration-300">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest text-center">Abrir Atendimento</span>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Nome do Cliente (Opcional)" 
                  value={clienteNome} 
                  onChange={(e) => {
                    setClienteNome(e.target.value);
                    setSelectedClienteId(null);
                  }} 
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none shadow-sm" 
                />
                {sugestoesClientes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto divide-y divide-stone-100">
                    {sugestoesClientes.map((c) => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          setClienteNome(c.nome);
                          setClienteTelefone(c.telefone || '');
                          setSelectedClienteId(c.id);
                          setSugestoesClientes([]);
                        }}
                        className="px-4 py-3 text-xs text-stone-700 hover:bg-stone-50 cursor-pointer font-bold uppercase flex justify-between items-center"
                      >
                        <span>{c.nome}</span>
                        <span className="text-[9px] text-stone-400 normal-case">{c.telefone || 'Sem Tel'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                <input 
                  type="text" 
                  placeholder="WhatsApp (DDD + Número) Opcional" 
                  value={clienteTelefone} 
                  onChange={(e) => setClienteTelefone(e.target.value)} 
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none shadow-sm" 
                />
              </div>
            </div>
            
            {!activeShift && !isShiftLoading ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                 <AlertCircle size={18} className="text-red-600 mt-0.5 animate-pulse" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-red-800 uppercase">Caixa Fechado</span>
                   <p className="text-[9px] font-bold text-red-700 uppercase leading-relaxed mt-0.5">
                     O caixa geral está fechado no momento. Solicite a abertura do caixa no painel de finanças para poder iniciar atendimentos.
                   </p>
                 </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                 <AlertCircle size={16} className="text-amber-600 mt-1" />
                 <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">Dica: Cadastre o WhatsApp para enviar o extrato da conta direto para o celular do cliente.</p>
              </div>
            )}

            <button 
              onClick={handleAbrirMesa} 
              disabled={isActionLoading || (!activeShift && !isShiftLoading)} 
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white transition-all
                ${(!activeShift && !isShiftLoading) ? 'bg-stone-300 cursor-not-allowed shadow-none' : 'bg-stone-900 shadow-md active:scale-95'}`}
            >
              {isActionLoading ? 'INICIANDO...' : 'INICIAR ATENDIMENTO'}
            </button>
          </div>
        ) : (
          <div className="bistro-card flex flex-col gap-4 animate-in fade-in duration-300">            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest"><Clock size={12} /><span>{formatElapsedTime(comanda.aberta_em)}</span></div>
                <div className="text-3xl font-black text-stone-900 tracking-tighter">{formatCurrency(comanda.total_calculado)}</div>
              </div>
              <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>{comanda.status}</Badge>
            </div>
            {comanda.clientes && (
               <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                 <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-stone-900">{comanda.clientes.nome}</span><span className="text-[8px] font-bold text-stone-400">{comanda.clientes.whatsapp || 'SEM WHATSAPP'}</span></div>
                 {comanda.clientes.whatsapp && (
                   <button onClick={shareWhatsApp} className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all"><MessageCircle size={18} /></button>
                 )}
               </div>
            )}
            <button onClick={() => { if (comanda.total_calculado === 0) { if(confirm('LIBERAR MESA VAZIA?')) { supabase.from('comandas').update({ status: 'paga', fechada_em: new Date().toISOString() }).eq('id', comanda.id).then(() => { supabase.from('mesas').update({ status: 'livre' }).eq('id', mesaId).then(() => { refresh(); router.push('/mesas'); }); }); } } else { setShowCheckout(true); } }} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"><Receipt size={18} /> FECHAR CONTA</button>
          </div>
        )}
        {/* ... (consumo atual mantido) */}
        {comanda && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Consumo Atual</h2>
            <div className="flex flex-col gap-2">
              {itens.length === 0 ? (
                <div className="py-10 text-center text-stone-300 font-bold uppercase text-[10px]">Sem itens lançados</div>
              ) : (
                itens.map((item) => (
                  <div key={item.id} className="flex justify-between bg-white p-4 rounded-xl border text-xs font-bold uppercase shadow-sm">
                    <span>{item.quantidade}x {item.produto.nome}</span>
                    <div className="flex items-center gap-3">
                      <span>{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                      <button onClick={() => handleCancelarItem(item.id)} className="text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      {/* ... (bottom bar mantida) */}
      {comanda && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-50 flex flex-col gap-4 z-40">
          {itensCarrinho.length > 0 ? (
            <button onClick={handleEnviarPedido} disabled={isActionLoading} className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest">
              <Send size={20} /> ENVIAR PEDIDO ({formatCurrency(totalCarrinho)})
            </button>
          ) : (
            <button onClick={() => router.push(`/cardapio?mesaId=${mesaId}`)} className="w-full bg-white border border-stone-200 text-stone-900 p-5 rounded-2xl shadow-sm font-bold uppercase flex items-center justify-center gap-3">
              <Plus size={20} /> ADICIONAR ITENS
            </button>
          )}
        </div>
      )}
    </div>
  );
}
