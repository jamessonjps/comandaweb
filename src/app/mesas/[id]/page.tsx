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
  Phone 
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

  // Estados para abertura de mesa
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleEnviarPedido = async () => {
    if (!comanda || itensCarrinho.length === 0 || !user) return;
    setIsActionLoading(true);

    try {
      const pedidosParaInserir = itensCarrinho.map(item => ({
        comanda_id: comanda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario, // Campo obrigatório no banco
        preco_unitario_congelado: item.preco_unitario, // Campo adicional que criamos
        observacao: item.observacao,
        criado_por: user.id
      }));

      const { error } = await supabase
        .from('itens_pedido')
        .insert(pedidosParaInserir);

      if (error) {
        alert('ERRO AO ENVIAR: ' + error.message);
        return;
      }
      
      limparCarrinho();
      alert('PEDIDO ENVIADO!');
      await refresh();
    } catch (err: any) {
      console.error('Erro ao enviar pedido:', err);
      alert('ERRO NO SISTEMA: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAbrirMesa = async () => {
    if (!user || isActionLoading) return;
    setIsActionLoading(true);

    try {
      let clienteId = null;

      // 1. Tentar criar o cliente (Se falhar, não deve travar a abertura da mesa)
      if (clienteNome.trim()) {
        try {
          const { data: cliente, error: cliError } = await supabase
            .from('clientes')
            .insert({ 
              nome: clienteNome, 
              telefone: clienteTelefone,
              whatsapp: clienteTelefone 
            })
            .select()
            .single();
          
          if (cliError) {
            console.warn('Não foi possível cadastrar o cliente, mas continuaremos:', cliError);
          } else if (cliente) {
            clienteId = cliente.id;
          }
        } catch (cErr) {
          console.warn('Erro silencioso ao criar cliente:', cErr);
        }
      }

      // 2. Abrir Comanda
      console.log('Inserindo comanda...', { mesa_id: mesaId, garcom_id: user.id, cliente_id: clienteId });
      const { error: insertError } = await supabase
        .from('comandas')
        .insert({
          mesa_id: mesaId,
          garcom_id: user.id,
          cliente_id: clienteId,
          status: 'aberta',
          status_pagamento: 'Pendente'
        });

      if (insertError) {
        console.error('Erro de inserção:', insertError);
        alert('ERRO AO ABRIR COMANDA: ' + insertError.message);
        setIsActionLoading(false);
        return;
      }

      // 3. Atualizar Mesa
      await supabase
        .from('mesas')
        .update({ status: 'ocupada' })
        .eq('id', mesaId);

      await refresh();

    } catch (err: any) {
      console.error('Erro fatal:', err);
      alert('ERRO DE CONEXÃO: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSolicitarFechamento = async () => {
    if (!comanda) return;
    try {
      await supabase.from('comandas').update({ status: 'fechando' }).eq('id', comanda.id);
      await supabase.from('mesas').update({ status: 'fechando' }).eq('id', mesaId);
      await refresh();
    } catch (err) {}
  };

  if (isLoading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-48 font-sans">
      <AppHeader 
        title={comanda ? `Mesa ${comanda.mesa.numero.toString().padStart(2, '0')}` : 'Abrir Mesa'} 
        showUser={false} 
        showBack={true}
      />

      <main className="px-6 py-4 flex flex-col gap-6">
        {/* Painel de Abertura ou Info */}
        <div className="bistro-card flex flex-col gap-4">
          {!comanda ? (
            <div className="flex flex-col gap-4 w-full">
              <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest text-center">Identificação do Cliente</span>
              
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Nome do Cliente (Opcional)"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-1 ring-stone-200"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="WhatsApp / Telefone"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-1 ring-stone-200"
                  />
                </div>
              </div>

              <button 
                onClick={handleAbrirMesa} 
                disabled={isActionLoading}
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                {isActionLoading ? 'PROCESSANDO...' : 'INICIAR ATENDIMENTO'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-stone-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                    <Clock size={12} />
                    <span>Há {formatElapsedTime(comanda.aberta_em)}</span>
                  </div>
                  <div className="text-3xl font-black text-stone-900 tracking-tighter">
                    {formatCurrency(comanda.total_calculado)}
                  </div>
                </div>
                <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>
                  {comanda.status}
                </Badge>
              </div>

              {comanda.clientes && (
                <div className="flex items-center gap-3 pt-3 border-t border-stone-50">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-stone-900 uppercase">{comanda.clientes.nome}</span>
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">{comanda.clientes.telefone || 'Sem Telefone'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Consumo */}
        {comanda && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1">Consumo da Mesa</h2>
            <div className="flex flex-col gap-2">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-stone-200 gap-2">
                  <AlertCircle size={32} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Mesa Vazia</span>
                </div>
              ) : (
                itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-stone-900 uppercase">{item.quantidade}x {item.produto.nome}</span>
                      {item.observacao && <span className="text-[10px] text-stone-400 italic mt-0.5">"{item.observacao}"</span>}
                    </div>
                    <span className="text-sm font-black text-stone-900">{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Itens no Carrinho */}
        {itensCarrinho.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.3em] px-1">Aguardando Envio</h2>
            <div className="flex flex-col gap-2">
              {itensCarrinho.map((item) => (
                <div key={item.produto_id} className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-100 border-dashed">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-amber-900 uppercase">{item.quantidade}x {item.nome}</span>
                  </div>
                  <span className="text-sm font-black text-amber-700">{formatCurrency(item.preco_unitario * item.quantidade)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Ações Fixas */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-50 to-transparent flex flex-col gap-4 z-40">
        {itensCarrinho.length > 0 ? (
          <button 
            onClick={handleEnviarPedido} 
            disabled={isActionLoading}
            className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Send size={20} />
            ENVIAR PEDIDO ({formatCurrency(totalCarrinho)})
          </button>
        ) : comanda && (
          <div className="flex gap-4">
            <button 
              onClick={() => router.push(`/cardapio?mesaId=${mesaId}`)} 
              className="flex-1 bg-white border border-stone-200 text-stone-900 p-4 rounded-xl shadow-sm flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              <Plus size={18} />
              ADICIONAR
            </button>
            <button 
              onClick={handleSolicitarFechamento} 
              disabled={comanda.status === 'fechando'}
              className="flex-1 bg-stone-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all"
            >
              <Receipt size={18} />
              FECHAR CONTA
            </button>
          </div>
        )}
        <button onClick={() => router.back()} className="w-full text-stone-400 font-bold text-[10px] uppercase tracking-[0.4em] py-2 text-center">
          ← Voltar
        </button>
      </div>
    </div>
  );
}
