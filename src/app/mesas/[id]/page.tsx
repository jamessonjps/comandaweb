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
        preco_unitario: item.preco_unitario,
        observacao: item.observacao,
        criado_por: user.id
      }));

      const { error } = await supabase
        .from('itens_pedido')
        .insert(pedidosParaInserir);

      if (error) throw error;
      
      limparCarrinho();
      alert('Pedido enviado com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar pedido:', err);
      alert('Erro ao enviar pedido.');
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
      const { data, error } = await supabase
        .from('comandas')
        .insert({
          mesa_id: mesaId,
          garcom_id: user.id,
          status: 'aberta'
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('mesas')
        .update({ status: 'ocupada' })
        .eq('id', mesaId);

      // O hook useComanda irá atualizar automaticamente via Realtime
    } catch (err) {
      console.error('Erro ao abrir mesa:', err);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-bg-base" />;

  return (
    <div className="min-h-screen bg-bg-base pb-40">
      <AppHeader 
        title={comanda ? `Mesa ${comanda.mesa.numero.toString().padStart(2, '0')}` : 'Abrir Mesa'} 
        showUser={false} 
        showBack={true}
      />

      <main className="px-6 py-4 flex flex-col gap-6">
        {/* Header de Info */}
        <div className="flex items-center justify-between bg-bg-surface p-4 rounded-2xl border border-border">
          {!comanda ? (
            <div className="flex flex-col gap-1">
              <span className="text-text-secondary text-sm">Esta mesa está livre</span>
              <Button onClick={handleAbrirMesa} variant="primary" className="mt-2">
                Abrir Nova Comanda
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider font-bold">
                  <Clock size={12} />
                  <span>Aberta há {formatElapsedTime(comanda.aberta_em)}</span>
                </div>
                <div className="text-2xl font-display font-black text-accent">
                  {formatCurrency(comanda.total_calculado)}
                </div>
              </div>
              <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>
                {comanda.status.toUpperCase()}
              </Badge>
            </>
          )}
        </div>

        {/* Lista de Itens Já Pedidos */}
        {comanda && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest px-1">
              Itens do Pedido
            </h2>
            <div className="flex flex-col gap-2">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted gap-2 opacity-50">
                  <AlertCircle size={32} />
                  <span className="text-sm">Nenhum item lançado ainda</span>
                </div>
              ) : (
                itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-bg-surface/50 p-3 rounded-xl border border-border/50">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary">
                        {item.quantidade}x {item.produto.nome}
                      </span>
                      {item.observacao && (
                        <span className="text-[10px] text-text-muted italic">"{item.observacao}"</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-text-secondary">
                        {formatCurrency(item.preco_unitario * item.quantidade)}
                      </span>
                      <Badge variant={item.status_item === 'entregue' ? 'success' : 'default'}>
                        {item.status_item}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Itens no Carrinho (Ainda não enviados) */}
        {itensCarrinho.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-accent uppercase tracking-widest px-1 flex items-center gap-2">
              Novos Itens (Aguardando Envio)
            </h2>
            <div className="flex flex-col gap-2">
              {itensCarrinho.map((item) => (
                <div key={item.produto_id} className="flex items-center justify-between bg-accent/5 p-3 rounded-xl border border-accent/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">
                      {item.quantidade}x {item.nome}
                    </span>
                  </div>
                  <span className="text-sm font-black text-accent">
                    {formatCurrency(item.preco_unitario * item.quantidade)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-base via-bg-base to-transparent flex flex-col gap-3">
        {itensCarrinho.length > 0 ? (
          <Button onClick={handleEnviarPedido} variant="primary" className="w-full py-6 text-lg shadow-fab">
            <Send size={20} />
            Enviar Pedido ({formatCurrency(totalCarrinho)})
          </Button>
        ) : comanda && (
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push(`/cardapio?mesaId=${mesaId}`)} 
              variant="secondary" 
              className="flex-1 py-4"
            >
              <Plus size={20} />
              Adicionar
            </Button>
            <Button 
              onClick={handleSolicitarFechamento} 
              variant="secondary" 
              className="flex-1 py-4 border-warning/30 text-warning"
              disabled={comanda.status === 'fechando'}
            >
              <Receipt size={20} />
              Fechar Conta
            </Button>
          </div>
        )}
        <Button onClick={() => router.back()} variant="ghost" className="w-full text-text-muted">
          <ArrowLeft size={16} />
          Voltar para Mesas
        </Button>
      </div>
    </div>
  );
}
