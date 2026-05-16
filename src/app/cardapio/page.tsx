"use client";

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { useProdutos } from '@/hooks/useProdutos';
import { useCarrinhoStore } from '@/store/carrinho.store';
import { formatCurrency } from '@/utils/formatters';

import { Skeleton, ProductSkeleton } from '@/components/ui/Skeleton';

function CardapioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesaId = searchParams.get('mesaId');
  
  const { produtos, categorias, isLoading } = useProdutos();
  const { itens: itensCarrinho, adicionarItem, atualizarQuantidade, total } = useCarrinhoStore();
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string | 'all'>('all');

  const filteredProdutos = useMemo(() => {
    return produtos.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'all' || p.categoria === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [produtos, search, activeTab]);

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Cardápio" showUser={false} showBack={true} backPath="/mesas" />

      <main className="flex flex-col gap-4">
        {/* Busca e Categorias Modernas */}
        <div className="sticky top-[108px] z-20 bg-white/90 backdrop-blur-md px-6 py-4 flex flex-col gap-4 border-b border-stone-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="O que você deseja hoje?" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-100 border border-stone-200 rounded-xl py-3 pl-12 pr-4 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all placeholder:text-stone-400 font-medium"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all
                ${activeTab === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}
            >
              TODOS
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all
                  ${activeTab === cat ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Produtos Limpa */}
        <div className="px-6 flex flex-col gap-4 py-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white animate-pulse rounded-xl border border-stone-100" />)
          ) : filteredProdutos.length > 0 ? (
            filteredProdutos.map(produto => {
              const itemNoCarrinho = itensCarrinho.find(i => i.produto_id === produto.id);
              const isEsgotado = produto.estoque_atual === 0;
              
              return (
                <div key={produto.id} className={`bistro-card flex items-center justify-between gap-4 ${isEsgotado ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900 uppercase tracking-tight">{produto.nome}</span>
                      {produto.volume_ml && (
                        <span className="text-[10px] font-bold text-stone-400">{produto.volume_ml}ml</span>
                      )}
                    </div>
                    <span className="text-sm font-black text-stone-900 mt-1">{formatCurrency(produto.preco)}</span>
                  </div>

                  {isEsgotado ? (
                    <span className="px-3 py-2 bg-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest rounded-xl">
                      Esgotado
                    </span>
                  ) : itemNoCarrinho ? (
                    <div className="flex items-center gap-4 bg-stone-50 rounded-xl px-2 py-1 border border-stone-100">
                      <button 
                        onClick={() => atualizarQuantidade(produto.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-900 active:scale-90 transition-transform"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="text-sm font-black w-4 text-center text-stone-900">{itemNoCarrinho.quantidade}</span>
                      <button 
                        onClick={() => atualizarQuantidade(produto.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-900 active:scale-90 transition-transform"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => adicionarItem({
                        produto_id: produto.id,
                        nome: produto.nome,
                        preco_unitario: produto.preco,
                        quantidade: 1
                      })}
                      className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                    >
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em]">
              Nenhum item encontrado
            </div>
          )}
        </div>
      </main>

      {/* Footer Carrinho Moderno */}
      {itensCarrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-50 to-transparent z-40">
          <button 
            onClick={() => mesaId ? router.push(`/mesas/${mesaId}`) : router.push('/mesas?assign=true')} 
            className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center font-bold uppercase tracking-widest active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} />
              <span className="text-xs">{mesaId ? 'Ver Pedido' : 'Vincular a uma Mesa'}</span>
            </div>
            <span className="font-black">{formatCurrency(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function CardapioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-text-secondary text-sm">Carregando cardápio...</span>
      </div>
    }>
      <CardapioContent />
    </Suspense>
  );
}
