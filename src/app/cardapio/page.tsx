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
    <div className="min-h-screen bg-amber-50 pb-32 font-serif">
      <AppHeader title="Cardápio" showUser={false} showBack={true} />

      <main className="flex flex-col gap-4">
        {/* Busca e Categorias Vintage */}
        <div className="sticky top-[100px] z-20 bg-amber-50/95 backdrop-blur-sm px-6 py-4 flex flex-col gap-4 border-b-2 border-amber-950">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-900/50" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar no cardápio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-amber-100 border-2 border-amber-950 rounded-none py-3 pl-12 pr-4 text-sm text-amber-950 focus:outline-none focus:bg-amber-200 transition-colors placeholder:text-amber-900/30 font-bold"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 border-2 font-display font-black text-[10px] uppercase tracking-widest transition-all
                ${activeTab === 'all' ? 'bg-amber-950 text-amber-50 border-amber-950' : 'bg-transparent text-amber-900 border-amber-900/20'}`}
            >
              TODOS
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-2 border-2 font-display font-black text-[10px] uppercase tracking-widest transition-all
                  ${activeTab === cat ? 'bg-amber-950 text-amber-50 border-amber-950' : 'bg-transparent text-amber-900 border-amber-900/20'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Produtos Estilo Gravura */}
        <div className="px-6 flex flex-col gap-6 py-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => <div key={i} className="h-24 bg-amber-100 animate-pulse border-2 border-amber-950/10" />)
          ) : filteredProdutos.length > 0 ? (
            filteredProdutos.map(produto => {
              const itemNoCarrinho = itensCarrinho.find(i => i.produto_id === produto.id);
              
              return (
                <div key={produto.id} className="woodcut-card bg-white p-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-lg font-display font-black text-amber-950 uppercase leading-tight">{produto.nome}</span>
                    <span className="text-sm font-display font-black text-amber-700 mt-1">{formatCurrency(produto.preco)}</span>
                  </div>

                  {itemNoCarrinho ? (
                    <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-950 p-1">
                      <button 
                        onClick={() => atualizarQuantidade(produto.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-amber-950 active:bg-amber-200"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="text-sm font-display font-black w-4 text-center">{itemNoCarrinho.quantidade}</span>
                      <button 
                        onClick={() => atualizarQuantidade(produto.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-amber-950 active:bg-amber-200"
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
                      className="p-3 bg-amber-950 text-amber-50 shadow-[4px_4px_0px_0px_#78350F] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center font-display font-black text-amber-900/30 uppercase tracking-widest">
              Nenhum item encontrado
            </div>
          )}
        </div>
      </main>

      {/* Footer Carrinho Vintage */}
      {itensCarrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-amber-50 to-transparent z-40">
          <button 
            onClick={() => mesaId ? router.push(`/mesas/${mesaId}`) : router.push('/mesas')} 
            className="w-full bg-amber-950 text-amber-50 p-5 shadow-[6px_6px_0px_0px_#78350F] flex justify-between items-center font-display font-black uppercase tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} />
              <span>Ver Pedido</span>
            </div>
            <span>{formatCurrency(total)}</span>
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
