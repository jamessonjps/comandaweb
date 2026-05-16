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
  DollarSign,
  Smartphone,
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

  // Estados
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Estados de Pagamento
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
    if (metodoAtual === 'fiado' && !comanda?.clientes?.telefone) {
      alert('PARA FIADO, O CLIENTE DEVE TER TELEFONE CADASTRADO.');
      return;
    }
    setPagamentos([...pagamentos, { metodo: metodoAtual, valor }]);
    setValorAtual('');
  };

  const handleFinalizarConta = async () => {
    if (faltaPagar > 0.01) {
      alert(`AINDA FALTA RECEBER ${formatCurrency(faltaPagar)}`);
      return;
    }
    setIsActionLoading(true);
    try {
      await supabase.from('pagamentos_comanda').insert(
        pagamentos.map(p => ({ comanda_id: comanda!.id, metodo: p.metodo, valor: p.valor }))
      );
      await supabase.from('comandas').update({ 
        status: 'paga',
        fechada_em: new Date().toISOString(),
        total_pago: jaPago,
        taxa_servico_inclusa: useTaxa,
        valor_taxa_servico: useTaxa ? comanda!.total_calculado * 0.1 : 0
      }).eq('id', comanda!.id);
      await supabase.from('mesas').update({ status: 'livre' }).eq('id', mesaId);
      alert('MESA FINALIZADA COM SUCESSO!');
      router.push('/mesas');
    } catch (err: any) {
      alert('ERRO AO FECHAR: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
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
      const { error } = await supabase.from('comandas').insert({ mesa_id: mesaId, garcom_id: user.id, cliente_id: clienteId, status: 'aberta', status_pagamento: 'Pendente' });
      if (error) throw error;
      await supabase.from('mesas').update({ status: 'ocupada' }).eq('id', mesaId);
      await refresh();
    } catch (err: any) { alert('ERRO: ' + err.message); } finally { setIsActionLoading(false); }
  };

  const handleEnviarPedido = async () => {
    if (!comanda || !user) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.from('itens_pedido').insert(itensCarrinho.map(i => ({ comanda_id: comanda.id, produto_id: i.produto_id, quantidade: i.quantidade, preco_unitario: i.preco_unitario, preco_unitario_congelado: i.preco_unitario, criado_por: user.id })));
      if (error) throw error;
      limparCarrinho();
      await refresh();
    } catch (err: any) { alert('ERRO: ' + err.message); } finally { setIsActionLoading(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-48 font-sans">
      <AppHeader title={comanda ? `Mesa ${comanda.mesa.numero.toString().padStart(2, '0')}` : 'Abrir Atendimento'} showUser={false} showBack={true} />

      {/* MODAL DE PAGAMENTO (CHECKOUT) */}
      {showCheckout && comanda && (
        <div className="fixed inset-0 bg-stone-900/90 z-50 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-xl font-black uppercase">Fechar Mesa {comanda.mesa.numero}</h2>
            <button onClick={() => setShowCheckout(false)}><XCircle size={32} /></button>
          </div>
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between border-b pb-4">
              <span className="text-stone-400 text-[10px] font-bold uppercase">Total Consumo</span>
              <span className="text-lg font-bold">{formatCurrency(comanda.total_calculado)}</span>
            </div>
            <label className="flex items-center gap-2 bg-stone-50 p-3 rounded-xl">
              <input type="checkbox" checked={useTaxa} onChange={(e) => setUseTaxa(e.target.checked)} />
              <span className="text-xs font-bold uppercase">Incluir Taxa 10% ({formatCurrency(comanda.total_calculado * 0.1)})</span>
            </label>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-black uppercase">Total a Pagar</span>
              <span className="text-3xl font-black">{formatCurrency(totalComTaxa)}</span>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t">
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
                <div className="flex flex-col"><span className="text-[8px] uppercase opacity-60">Faltando</span><span className="text-xl font-black">{formatCurrency(faltaPagar)}</span></div>
                <button onClick={handleFinalizarConta} disabled={faltaPagar > 0.01 || isActionLoading} className="bg-white text-stone-900 px-6 py-3 rounded-xl font-bold uppercase text-xs disabled:opacity-50">FINALIZAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="px-6 py-4 flex flex-col gap-6">
        <div className="bistro-card flex flex-col gap-4">
          {!comanda ? (
            <div className="flex flex-col gap-4 w-full">
              <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest text-center">Identificação</span>
              <div className="flex flex-col gap-3">
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} /><input type="text" placeholder="Nome" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="w-full bg-stone-50 border rounded-xl py-3 pl-10 pr-4 text-sm" /></div>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} /><input type="text" placeholder="WhatsApp" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} className="w-full bg-stone-50 border rounded-xl py-3 pl-10 pr-4 text-sm" /></div>
              </div>
              <button onClick={handleAbrirMesa} disabled={isActionLoading} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest">{isActionLoading ? 'INICIANDO...' : 'INICIAR ATENDIMENTO'}</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold"><Clock size={12} /><span>{formatElapsedTime(comanda.aberta_em)}</span></div>
                  <div className="text-3xl font-black text-stone-900">{formatCurrency(comanda.total_calculado)}</div>
                </div>
                <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>{comanda.status}</Badge>
              </div>
              {comanda.clientes && <div className="text-[10px] font-bold uppercase text-stone-400">{comanda.clientes.nome} • {comanda.clientes.telefone || 'S/ TEL'}</div>}
            </div>
          )}
        </div>

        {comanda && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Consumo</h2>
            <div className="flex flex-col gap-2">
              {itens.map((item) => (
                <div key={item.id} className="flex justify-between bg-white p-4 rounded-xl border font-bold uppercase text-xs">
                  <span>{item.quantidade}x {item.produto.nome}</span><span>{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-50 flex flex-col gap-4">
        {itensCarrinho.length > 0 ? (
          <button onClick={handleEnviarPedido} disabled={isActionLoading} className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl font-bold uppercase flex items-center justify-center gap-3">
            <Send size={20} /> ENVIAR PEDIDO ({formatCurrency(totalCarrinho)})
          </button>
        ) : comanda && (
          <div className="flex gap-4">
            <button onClick={() => router.push(`/cardapio?mesaId=${mesaId}`)} className="flex-1 bg-white border p-4 rounded-xl font-bold uppercase text-xs">ADICIONAR</button>
            <button 
              onClick={() => {
                if (comanda.total_calculado === 0) {
                  if(confirm('LIBERAR MESA VAZIA?')) {
                    supabase.from('comandas').update({ status: 'paga', fechada_em: new Date().toISOString() }).eq('id', comanda.id);
                    supabase.from('mesas').update({ status: 'livre' }).eq('id', mesaId);
                    router.push('/mesas');
                  }
                } else {
                  setShowCheckout(true);
                }
              }} 
              className="flex-1 bg-stone-900 text-white p-4 rounded-xl font-bold uppercase text-xs"
            >
              FECHAR CONTA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
