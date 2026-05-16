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
  XCircle
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
  const faltaPagar = totalComTaxa - jaPago;

  const handleAddPagamento = () => {
    const valor = parseFloat(valorAtual);
    if (isNaN(valor) || valor <= 0) return;
    setPagamentos([...pagamentos, { metodo: metodoAtual, valor }]);
    setValorAtual('');
  };

  const handleFinalizarConta = async () => {
    if (faltaPagar > 0.01) {
      alert(`FALTA RECEBER: ${formatCurrency(faltaPagar)}`);
      return;
    }
    setIsActionLoading(true);
    try {
      // 1. Registrar pagamentos
      const { error: pErr } = await supabase.from('pagamentos_comanda').insert(
        pagamentos.map(p => ({ comanda_id: comanda!.id, metodo: p.metodo, valor: p.valor }))
      );
      if (pErr) throw new Error('Falha ao registrar pagamentos: ' + pErr.message);

      // 2. Fechar comanda
      const { error: cErr } = await supabase.from('comandas').update({ 
        status: 'paga',
        fechada_em: new Date().toISOString(),
        total_pago: jaPago,
        taxa_servico_inclusa: useTaxa,
        valor_taxa_servico: useTaxa ? comanda!.total_calculado * 0.1 : 0
      }).eq('id', comanda!.id);
      if (cErr) throw new Error('Falha ao fechar comanda: ' + cErr.message);

      // 3. Liberar mesa
      const { error: mErr } = await supabase.from('mesas').update({ status: 'livre' }).eq('id', mesaId);
      if (mErr) throw new Error('Falha ao liberar mesa: ' + mErr.message);

      alert('MESA LIBERADA COM SUCESSO!');
      router.push('/mesas');
    } catch (err: any) {
      alert('ERRO CRÍTICO: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAbrirMesa = async () => {
    if (!user) {
      alert('ERRO: USUÁRIO NÃO LOGADO. REFAÇA O LOGIN.');
      return;
    }
    setIsActionLoading(true);
    try {
      let clienteId = null;
      if (clienteNome.trim()) {
        const { data: cliente, error: cliError } = await supabase.from('clientes').insert({ nome: clienteNome, telefone: clienteTelefone, whatsapp: clienteTelefone }).select().maybeSingle();
        if (cliente) clienteId = cliente.id;
      }

      const { error: comandaError } = await supabase.from('comandas').insert({
        mesa_id: mesaId,
        garcom_id: user.id,
        cliente_id: clienteId,
        status: 'aberta',
        status_pagamento: 'Pendente'
      });

      if (comandaError) throw new Error('Erro ao criar comanda: ' + comandaError.message);

      const { error: mesaError } = await supabase.from('mesas').update({ status: 'ocupada' }).eq('id', mesaId);
      if (mesaError) throw new Error('Erro ao ocupar mesa: ' + mesaError.message);

      await refresh();
    } catch (err: any) {
      alert('ERRO AO INICIAR: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-48 font-sans">
      <AppHeader title={comanda ? `Mesa ${comanda.mesa.numero.toString().padStart(2, '0')}` : 'Abrir Atendimento'} showUser={false} showBack={true} />

      {showCheckout && comanda && (
        <div className="fixed inset-0 bg-stone-900/95 z-50 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-xl font-black uppercase">Finalizar Mesa {comanda.mesa.numero}</h2>
            <button onClick={() => setShowCheckout(false)}><XCircle size={32} /></button>
          </div>
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between border-b pb-4">
              <span className="text-stone-400 text-[10px] font-bold uppercase">Subtotal</span>
              <span className="font-bold">{formatCurrency(comanda.total_calculado)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-black uppercase">Total com 10%</span>
              <span className="text-2xl font-black">{formatCurrency(totalComTaxa)}</span>
            </div>
            <div className="flex gap-2">
              <select value={metodoAtual} onChange={(e) => setMetodoAtual(e.target.value)} className="flex-1 bg-stone-50 border rounded-xl p-3 text-xs font-bold uppercase">
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao_debito">C. Débito</option>
                <option value="cartao_credito">C. Crédito</option>
                <option value="fiado">Fiado</option>
              </select>
              <input type="number" placeholder="Valor" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} className="w-24 bg-stone-50 border rounded-xl p-3 text-xs font-bold" />
              <button onClick={handleAddPagamento} className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center"><Plus /></button>
            </div>
            <div className="flex flex-col gap-1">
              {pagamentos.map((p, i) => (
                <div key={i} className="flex justify-between text-[10px] font-bold uppercase bg-stone-50 p-2 rounded-lg">
                  <span>{p.metodo}</span><span>{formatCurrency(p.valor)}</span>
                </div>
              ))}
            </div>
            <div className="bg-stone-900 text-white p-4 rounded-2xl flex justify-between items-center">
              <div className="flex flex-col"><span className="text-[8px] uppercase opacity-60">Falta</span><span className="text-lg font-black">{formatCurrency(faltaPagar)}</span></div>
              <button onClick={handleFinalizarConta} disabled={faltaPagar > 0.01 || isActionLoading} className="bg-white text-stone-900 px-4 py-3 rounded-xl font-bold uppercase text-[10px]">{isActionLoading ? 'SALVANDO...' : 'FECHAR AGORA'}</button>
            </div>
          </div>
        </div>
      )}

      <main className="px-6 py-4 flex flex-col gap-6">
        {!comanda ? (
          <div className="bistro-card flex flex-col gap-4">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest text-center">Abrir Atendimento</span>
            <div className="flex flex-col gap-3">
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} /><input type="text" placeholder="Nome do Cliente" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="w-full bg-stone-50 border rounded-xl py-3 pl-10 pr-4 text-sm" /></div>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} /><input type="text" placeholder="WhatsApp" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} className="w-full bg-stone-50 border rounded-xl py-3 pl-10 pr-4 text-sm" /></div>
            </div>
            <button onClick={handleAbrirMesa} disabled={isActionLoading} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest">{isActionLoading ? 'PROCESSANDO...' : 'INICIAR'}</button>
          </div>
        ) : (
          <div className="bistro-card flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-stone-900">{formatCurrency(comanda.total_calculado)}</span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{comanda.clientes?.nome || 'Mesa Local'}</span>
                </div>
                <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>{comanda.status}</Badge>
             </div>
             <button onClick={() => {
               if (comanda.total_calculado === 0) {
                 if (confirm('LIBERAR MESA VAZIA?')) {
                   supabase.from('comandas').update({ status: 'paga', fechada_em: new Date().toISOString() }).eq('id', comanda.id).then(() => {
                     supabase.from('mesas').update({ status: 'livre' }).eq('id', mesaId).then(() => {
                       refresh();
                       router.push('/mesas');
                     });
                   });
                 }
               } else {
                 setShowCheckout(true);
               }
             }} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2">
               <Receipt size={18} /> FECHAR CONTA
             </button>
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
                   <div key={item.id} className="flex justify-between bg-white p-4 rounded-xl border text-xs font-bold uppercase">
                     <span>{item.quantidade}x {item.produto.nome}</span><span>{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}
      </main>

      {comanda && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-50 flex flex-col gap-4">
          <button onClick={() => router.push(`/cardapio?mesaId=${mesaId}`)} className="w-full bg-white border border-stone-200 text-stone-900 p-5 rounded-2xl shadow-sm font-bold uppercase flex items-center justify-center gap-3">
             <Plus size={20} /> ADICIONAR ITENS
          </button>
        </div>
      )}
    </div>
  );
}
