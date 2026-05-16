"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Package, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque_atual: number;
  volume_ml?: number;
  disponivel: boolean;
  categorias?: { nome: string };
}

export default function AdminCardapioPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  if (!user || user.nivel_acesso !== 'admin') {
    router.push('/mesas');
    return null;
  }

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categorias(nome)')
      .order('nome', { ascending: true });

    if (!error) setProdutos(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Cardápio & Estoque" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Ação de Novo Produto */}
        <button className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest active:scale-[0.98] transition-all">
          <Plus size={20} />
          ADICIONAR NOVO PRODUTO
        </button>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar produto..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-12 pr-4 text-sm text-stone-900 focus:outline-none shadow-sm"
          />
        </div>

        {/* Lista de Produtos */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1">Itens no Cardápio</h2>
          
          {isLoading ? (
            <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            filteredProdutos.map((produto) => (
              <div key={produto.id} className="bistro-card flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-stone-900 uppercase leading-tight">{produto.nome}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {produto.categorias?.nome || 'Sem categoria'} • {produto.volume_ml}ml
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl bg-stone-50 text-stone-900 flex items-center justify-center active:scale-90"><Edit3 size={18} /></button>
                    <button className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center active:scale-90"><Trash2 size={18} /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-stone-400 uppercase font-bold tracking-widest">Preço de Venda</span>
                    <span className="text-lg font-black text-stone-900">{formatCurrency(produto.preco)}</span>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-stone-400 uppercase font-bold tracking-widest">Estoque</span>
                    <div className="flex items-center gap-2">
                      {produto.estoque_atual <= 5 && <AlertTriangle size={12} className="text-amber-600 animate-pulse" />}
                      <span className={`text-sm font-bold ${produto.estoque_atual <= 0 ? 'text-red-600' : 'text-stone-900'}`}>
                        {produto.estoque_atual} un
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
