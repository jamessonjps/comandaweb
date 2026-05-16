"use client";

import React, { useState } from 'react';
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
  Smartphone
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
  
  const [pagamentos, setPagamentos] = useState<{metodo: string, valor: number}[]>([]);
  const [metodoAtual, setMetodoAtual] = useState('dinheiro');
  const [valorAtual, setValorAtual] = useState('');
  const [useTaxa, setUseTaxa] = useState(true);

  const totalComTaxa = (comanda?.total_calculado || 0) * (useTaxa ? 1.1 : 1);
  const jaPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const faltaPagar = Math.max(0, totalComTaxa - jaPago);
  const troco = Math.max(0, jaPago - totalComTaxa);

  const handleAddPagamento = () => {
    const valor = parseFloat(valorAtual);
    if (isNaN(valor) || valor <= 0) return;
    setPagamentos([...pagamentos, { metodo: metodoAtual, valor }]);
    setValorAtual('');
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
    setIsActionLoading(true);
    try {
      let clienteId = null;
      if (clienteNome.trim()) {
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
    let texto = `*--- CONTA PARCIAL ---*\n*Mesa ${comanda.mesa.numero}*\n\n`;
    itens.forEach((i: any) => {
      texto += `${i.quantidade}x ${i.produto.nome}: ${formatCurrency(i.preco_unitario_congelado * i.quantidade)}\n`;
    });
    texto += `\n*TOTAL: ${formatCurrency(comanda.total_calculado)}*\n\nObrigado!`;
    const phone = comanda.clientes?.whatsapp || comanda.clientes?.telefone || '';
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-48 font-sans">
      <AppHeader title={comanda ? `Mesa ${comanda.mesa.numero.toString().padStart(2, '0')}` : 'Novo Atendimento'} showUser={false} showBack={true} />

      {showCheckout && comanda && (
        <div className="fixed inset-0 bg-stone-900/95 z-50 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex justify-between items-center text-white"><h2 className="text-xl font-black uppercase tracking-tighter">Mesa {comanda.mesa.numero}</h2><button onClick={() => setShowCheckout(false)}><XCircle size={32} /></button></div>
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between border-b pb-4"><span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Subtotal</span><span className="font-bold text-lg">{formatCurrency(comanda.total_calculado)}</span></div>
            <div className="flex justify-between items-center py-2"><span className="text-sm font-black uppercase">Total com 10%</span><span className="text-3xl font-black text-stone-900">{formatCurrency(totalComTaxa)}</span></div>
            <div className="flex gap-2">
              <select value={metodoAtual} onChange={(e) => setMetodoAtual(e.target.value)} className="flex-1 bg-stone-50 border rounded-xl p-3 text-xs font-bold uppercase"><option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="cartao_debito">C. Débito</option><option value="cartao_credito">C. Crédito</option><option value="fiado">Fiado</option></select>
              <input type="number" placeholder="Valor" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} className="w-24 bg-stone-50 border rounded-xl p-3 text-xs font-bold" />
              <button onClick={handleAddPagamento} className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center"><Plus /></button>
            </div>
            <div className="flex flex-col gap-1">
              {pagamentos.map((p, i) => (<div key={i} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg text-[10px] font-bold uppercase"><span>{p.metodo}</span><div className="flex items-center gap-2"><span>{formatCurrency(p.valor)}</span>{user?.nivel_acesso === 'GERENTE' && <button onClick={() => setPagamentos(pagamentos.filter((_, idx) => idx !== i))} className="text-red-500"><MinusCircle size={14} /></button>}</div></div>))}
            </div>
            <div className="bg-stone-900 text-white p-5 rounded-2xl flex justify-between items-center mt-2 shadow-xl">
              <div className="flex flex-col"><span className="text-[8px] uppercase opacity-60">Troco</span><span className="text-xl font-black">{troco > 0 ? formatCurrency(troco) : formatCurrency(faltaPagar)}</span></div>
              <button onClick={handleFinalizarConta} disabled={(jaPago < totalComTaxa - 0.01) || isActionLoading} className="bg-white text-stone-900 px-6 py-3 rounded-xl font-bold uppercase text-xs">FINALIZAR</button>
            </div>
            <button onClick={shareWhatsApp} className="w-full py-4 text-[10px] font-black uppercase text-green-600 bg-green-50 rounded-xl flex items-center justify-center gap-2"><Smartphone size={16} /> ENVIAR CONTA PARCIAL</button>
          </div>
        </div>
      )}

      <main className="px-6 py-4 flex flex-col gap-6">
        {!comanda ? (
          <div className="bistro-card flex flex-col gap-4">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest text-center">Abrir Atendimento</span>
            <div className="flex flex-col gap-3">
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} /><input type="text" placeholder="Nome do Cliente" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-sm" /></div>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} /><input type="text" placeholder="WhatsApp" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-sm" /></div>
            </div>
            <button onClick={handleAbrirMesa} disabled={isActionLoading} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest">{isActionLoading ? 'INICIANDO...' : 'INICIAR ATENDIMENTO'}</button>
          </div>
        ) : (
          <div className="bistro-card flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest"><Clock size={12} /><span>{formatElapsedTime(comanda.aberta_em)}</span></div>
                <div className="text-3xl font-black text-stone-900 tracking-tighter">{formatCurrency(comanda.total_calculado)}</div>
              </div>
              <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>{comanda.status}</Badge>
            </div>
            {comanda.clientes && <div className="text-[10px] font-bold uppercase text-stone-900">{comanda.clientes.nome} • {comanda.clientes.telefone || 'S/ TEL'}</div>}
            <button onClick={() => { if (comanda.total_calculado === 0) { if(confirm('LIBERAR MESA VAZIA?')) { supabase.from('comandas').update({ status: 'paga', fechada_em: new Date().toISOString() }).eq('id', comanda.id).then(() => { supabase.from('mesas').update({ status: 'livre' }).eq('id', mesaId).then(() => { refresh(); router.push('/mesas'); }); }); } } else { setShowCheckout(true); } }} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"><Receipt size={18} /> FECHAR CONTA</button>
          </div>
        )}

        {comanda && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Consumo Atual</h2>
            <div className="flex flex-col gap-2">
              {itens.length === 0 ? (
                <div className="py-10 text-center text-stone-300 font-bold uppercase text-[10px]">Sem itens lançados</div>
              ) : (
                itens.map((item) => (
                  <div key={item.id} className="flex justify-between bg-white p-4 rounded-xl border text-xs font-bold uppercase shadow-sm">
                    <span>{item.quantidade}x {item.produto.nome}</span><span>{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

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
