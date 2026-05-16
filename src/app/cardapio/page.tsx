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
      const matchesTab = activeTab === 'all' || p.categoria_id === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [produtos, search, activeTab]);

  return (
    <div className="min-h-screen bg-bg-base pb-32">
      <AppHeader title="Cardápio" showUser={false} showBack={true} />

      <main className="flex flex-col gap-4">
        {/* Busca e Tabs */}
        <div className="sticky top-[73px] z-20 bg-bg-base/80 backdrop-blur-md px-6 py-4 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar produto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all
                ${activeTab === 'all' ? 'bg-accent text-black border-accent' : 'bg-bg-surface text-text-secondary border-border'}`}
            >
              TODOS
            </button>
            {categorias.length === 0 && isLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="w-20 h-8 rounded-full" />)
            ) : categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all
                  ${activeTab === cat.id ? 'bg-accent text-black border-accent' : 'bg-bg-surface text-text-secondary border-border'}`}
              >
                {cat.nome.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="px-6 flex flex-col gap-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => <ProductSkeleton key={i} />)
          ) : filteredProdutos.map(produto => {
            const itemNoCarrinho = itensCarrinho.find(i => i.produto_id === produto.id);
            
            return (
              <div key={produto.id} className="bg-bg-surface p-4 rounded-2xl border border-border flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-sm font-bold text-text-primary">{produto.nome}</span>
                  {produto.descricao && <span className="text-[10px] text-text-muted line-clamp-1">{produto.descricao}</span>}
                  <span className="text-sm font-black text-accent mt-1">{formatCurrency(produto.preco)}</span>
                </div>

                {itemNoCarrinho ? (
                  <div className="flex items-center gap-3 bg-bg-elevated p-1 rounded-xl border border-border">
                    <button 
                      onClick={() => atualizarQuantidade(produto.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-text-primary active:bg-accent/20 rounded-lg"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{itemNoCarrinho.quantidade}</span>
                    <button 
                      onClick={() => atualizarQuantidade(produto.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-accent active:bg-accent/20 rounded-lg"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <Button 
                    variant="secondary" 
                    className="px-4 py-2 rounded-xl"
                    onClick={() => adicionarItem({
                      produto_id: produto.id,
                      nome: produto.nome,
                      preco_unitario: produto.preco,
                      quantidade: 1
                    })}
                  >
                    <Plus size={18} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Carrinho */}
      {itensCarrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-base via-bg-base to-transparent">
          <Button 
            onClick={() => mesaId ? router.push(`/mesas/${mesaId}`) : router.push('/mesas')} 
            variant="primary" 
            className="w-full py-6 text-lg shadow-fab flex justify-between px-8"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} />
              <span>Ver Pedido</span>
            </div>
            <span className="font-black">{formatCurrency(total)}</span>
          </Button>
        </div>
      )}

      {!itensCarrinho.length && (
        <div className="fixed bottom-6 left-6">
          <Button onClick={() => router.back()} variant="secondary" className="rounded-full w-12 h-12 p-0">
            <ArrowLeft size={20} />
          </Button>
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
