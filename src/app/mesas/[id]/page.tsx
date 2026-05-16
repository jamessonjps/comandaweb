"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Receipt, Send, Clock, AlertCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useComanda } from '@/hooks/useComanda';
import { useCarrinhoStore } from '@/store/carrinho.store';
import { formatCurrency, formatElapsedTime } from '@/utils/formatters';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export default function ComandaDetalhesPage() {
  const { id: mesaId } = useParams() as { id: string };
  const router = useRouter();
  const { comanda, itens, isLoading } = useComanda(mesaId);
  const { itens: itensCarrinho, total: totalCarrinho, limparCarrinho } = useCarrinhoStore();
  const user = useAuthStore(state => state.user);

  const handleEnviarPedido = async () => {
    if (!comanda || itensCarrinho.length === 0 || !user) return;

    try {
      const pedidosParaInserir = itensCarrinho.map(item => ({
        comanda_id: comanda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario_congelado: item.preco_unitario,
        observacao: item.observacao,
        criado_por: user.id
      }));

      const { error } = await supabase
        .from('itens_pedido')
        .insert(pedidosParaInserir);

      if (error) throw error;
      
      limparCarrinho();
      alert('PEDIDO ENVIADO!');
    } catch (err) {
      console.error('Erro ao enviar pedido:', err);
      alert('ERRO AO ENVIAR.');
    }
  };

  const handleSolicitarFechamento = async () => {
    if (!comanda) return;
    
    try {
      const { error } = await supabase
        .from('comandas')
        .update({ status: 'fechando' })
        .eq('id', comanda.id);

      if (error) throw error;

      const { error: mesaError } = await supabase
        .from('mesas')
        .update({ status: 'fechando' })
        .eq('id', mesaId);

      if (mesaError) throw mesaError;
      
    } catch (err) {
      console.error('Erro ao solicitar fechamento:', err);
    }
  };

  const handleAbrirMesa = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('comandas')
        .insert({
          mesa_id: mesaId,
          criado_por: user.id,
          status_pagamento: 'Pendente'
        });

      if (error) throw error;

      await supabase
        .from('mesas')
        .update({ status: 'ocupada' })
        .eq('id', mesaId);

    } catch (err) {
      console.error('Erro ao abrir mesa:', err);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-amber-50 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-amber-950 border-t-transparent rounded-full animate-spin" />
  </div>;

  return (
    <div className="min-h-screen bg-amber-50 pb-48 font-serif">
      <AppHeader 
        title={comanda ? `Mesa ${comanda.mesa.numero.toString().padStart(2, '0')}` : 'Abrir Mesa'} 
        showUser={false} 
        showBack={true}
      />

      <main className="px-6 py-4 flex flex-col gap-6">
        {/* Header de Info Estilo Gravura */}
        <div className="woodcut-card bg-amber-100 flex items-center justify-between">
          {!comanda ? (
            <div className="flex flex-col gap-1 w-full">
              <span className="text-amber-900 text-xs font-black uppercase tracking-widest">Mesa Disponível</span>
              <Button onClick={handleAbrirMesa} variant="primary" className="mt-2 w-full">
                INICIAR COMANDA
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-amber-900 text-[10px] uppercase tracking-[0.2em] font-black">
                  <Clock size={12} />
                  <span>Há {formatElapsedTime(comanda.aberta_em)}</span>
                </div>
                <div className="text-3xl font-display font-black text-amber-950">
                  {formatCurrency(comanda.total_calculado)}
                </div>
              </div>
              <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>
                {comanda.status}
              </Badge>
            </>
          )}
        </div>

        {/* Lista de Itens Já Pedidos */}
        {comanda && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-display font-black text-amber-900 uppercase tracking-[0.3em] px-1 border-b-2 border-amber-950 pb-2">
              Consumo Local
            </h2>
            <div className="flex flex-col gap-3">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-amber-900/20 gap-2">
                  <AlertCircle size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Comanda Vazia</span>
                </div>
              ) : (
                itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white/50 p-3 border-2 border-amber-950/20 border-dashed">
                    <div className="flex flex-col">
                      <span className="text-sm font-display font-black text-amber-950 uppercase">
                        {item.quantidade}x {item.produto.nome}
                      </span>
                      {item.observacao && (
                        <span className="text-[10px] text-amber-800 italic">"{item.observacao}"</span>
                      )}
                    </div>
                    <span className="text-sm font-display font-black text-amber-950">
                      {formatCurrency(item.preco_unitario_congelado * item.quantidade)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Itens no Carrinho (Aguardando Envio) */}
        {itensCarrinho.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-display font-black text-red-900 uppercase tracking-[0.3em] px-1">
              Novos Itens (A ENVIAR)
            </h2>
            <div className="flex flex-col gap-2">
              {itensCarrinho.map((item) => (
                <div key={item.produto_id} className="flex items-center justify-between bg-red-50 p-3 border-2 border-red-900/30 border-dashed">
                  <div className="flex flex-col">
                    <span className="text-sm font-display font-black text-red-950 uppercase">
                      {item.quantidade}x {item.nome}
                    </span>
                  </div>
                  <span className="text-sm font-display font-black text-red-900">
                    {formatCurrency(item.preco_unitario * item.quantidade)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Ações Fixas Vintage */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-amber-50 to-transparent flex flex-col gap-4 z-40">
        {itensCarrinho.length > 0 ? (
          <button 
            onClick={handleEnviarPedido} 
            className="w-full bg-amber-950 text-amber-50 p-5 shadow-[6px_6px_0px_0px_#78350F] flex items-center justify-center gap-3 font-display font-black uppercase tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            <Send size={20} />
            ENVIAR PEDIDO ({formatCurrency(totalCarrinho)})
          </button>
        ) : comanda && (
          <div className="flex gap-4">
            <button 
              onClick={() => router.push(`/cardapio?mesaId=${mesaId}`)} 
              className="flex-1 bg-amber-100 border-2 border-amber-950 p-4 shadow-[4px_4px_0px_0px_#451A03] flex items-center justify-center gap-2 font-display font-black text-xs uppercase tracking-widest active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Plus size={18} />
              ADICIONAR
            </button>
            <button 
              onClick={handleSolicitarFechamento} 
              disabled={comanda.status === 'fechando'}
              className="flex-1 bg-amber-950 text-amber-50 p-4 shadow-[4px_4px_0px_0px_#78350F] flex items-center justify-center gap-2 font-display font-black text-xs uppercase tracking-widest disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Receipt size={18} />
              FECHAR CONTA
            </button>
          </div>
        )}
        <button 
          onClick={() => router.back()} 
          className="w-full text-amber-900/60 font-display font-black text-[10px] uppercase tracking-[0.4em] py-2"
        >
          ← Voltar para Mesas
        </button>
      </div>
    </div>
  );
}
