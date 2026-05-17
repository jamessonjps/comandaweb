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
  AlertTriangle,
  XCircle,
  Save,
  Check
} from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque_atual: number;
  volume_ml?: number;
  disponivel: boolean;
  categoria_id: string;
  categorias?: { nome: string };
}

interface Categoria {
  id: string;
  nome: string;
}

export default function AdminCardapioPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cardapio' | 'estoque'>('cardapio');
  
  // Estados para Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Partial<Produto> | null>(null);

  // Bloqueio de acesso (liberado para admin e GERENTE)
  useEffect(() => {
    if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
      router.push('/mesas');
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: prodData } = await supabase.from('produtos').select('*, categorias(nome)').order('nome', { ascending: true });
    const { data: catData } = await supabase.from('categorias').select('*').order('nome');
    setProdutos(prodData || []);
    setCategorias(catData || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduto?.nome || !editingProduto?.preco) return;

    try {
      if (editingProduto.id) {
        // Update
        const { error } = await supabase.from('produtos').update({
          nome: editingProduto.nome,
          preco: editingProduto.preco,
          estoque_atual: editingProduto.estoque_atual,
          volume_ml: editingProduto.volume_ml,
          categoria_id: editingProduto.categoria_id,
          disponivel: editingProduto.disponivel
        }).eq('id', editingProduto.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('produtos').insert([{
          nome: editingProduto.nome,
          preco: editingProduto.preco,
          estoque_atual: editingProduto.estoque_atual,
          volume_ml: editingProduto.volume_ml,
          categoria_id: editingProduto.categoria_id,
          disponivel: true
        }]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { alert('ERRO AO SALVAR: ' + err.message); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('TEM CERTEZA QUE DESEJA EXCLUIR ESTE PRODUTO?')) {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) alert('ERRO AO EXCLUIR: ' + error.message);
      else fetchData();
    }
  };

  const handleQuickStockUpdate = async (id: string, delta: number) => {
    const prod = produtos.find(p => p.id === id);
    if (!prod) return;
    const newStock = Math.max(0, prod.estoque_atual + delta);
    
    // Otimista
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, estoque_atual: newStock } : p));
    
    const { error } = await supabase
      .from('produtos')
      .update({ estoque_atual: newStock })
      .eq('id', id);
      
    if (error) {
      alert('ERRO AO ATUALIZAR ESTOQUE: ' + error.message);
      fetchData();
    }
  };

  const filteredProdutos = produtos.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Gestão de Produtos" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        <button 
          onClick={() => { setEditingProduto({ nome: '', preco: 0, estoque_atual: 0, volume_ml: 0, categoria_id: categorias[0]?.id }); setShowModal(true); }}
          className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest active:scale-95 transition-all"
        >
          <Plus size={20} /> ADICIONAR NOVO PRODUTO
        </button>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input type="text" placeholder="Buscar no cardápio..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-stone-100 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none shadow-sm" />
        </div>

        {/* Seletor de Modo de Visualização */}
        <div className="flex bg-stone-100 p-1 rounded-xl shadow-inner border border-stone-200">
          <button 
            type="button"
            onClick={() => setViewMode('cardapio')} 
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'cardapio' ? 'bg-white text-stone-900 shadow-sm font-black' : 'text-stone-400 hover:text-stone-900'}`}
          >
            Editar Itens
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('estoque')} 
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'estoque' ? 'bg-white text-stone-900 shadow-sm font-black' : 'text-stone-400 hover:text-stone-900'}`}
          >
            Ajustar Estoque
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            filteredProdutos.map((p) => {
              if (viewMode === 'estoque') {
                return (
                  <div key={p.id} className="bistro-card flex flex-col gap-4 border-stone-200">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-stone-900 uppercase">{p.nome}</span>
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{p.categorias?.nome || 'S/ CAT'} • {p.volume_ml}ml</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mr-1">Estoque:</span>
                        <span className={`text-sm font-black ${p.estoque_atual <= 5 ? 'text-amber-600' : 'text-stone-900'}`}>{p.estoque_atual} un</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-stone-50">
                      <button 
                        type="button"
                        onClick={() => handleQuickStockUpdate(p.id, -5)} 
                        className="bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bold py-2 rounded-xl text-xs transition-all"
                      >
                        -5
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleQuickStockUpdate(p.id, -1)} 
                        className="bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bold py-2 rounded-xl text-xs transition-all"
                      >
                        -1
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleQuickStockUpdate(p.id, 1)} 
                        className="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-bold py-2 rounded-xl text-xs transition-all"
                      >
                        +1
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleQuickStockUpdate(p.id, 5)} 
                        className="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-bold py-2 rounded-xl text-xs transition-all"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              }

              // viewMode === 'cardapio'
              return (
                <div key={p.id} className="bistro-card flex flex-col gap-4 border-stone-200">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-stone-900 uppercase">{p.nome}</span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{p.categorias?.nome || 'S/ CAT'} • {p.volume_ml}ml</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingProduto(p); setShowModal(true); }} className="w-9 h-9 rounded-lg bg-stone-50 text-stone-600 flex items-center justify-center"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-stone-50">
                    <div className="flex flex-col"><span className="text-[8px] text-stone-400 uppercase font-bold tracking-widest">Preço</span><span className="text-lg font-black text-stone-900">{formatCurrency(p.preco)}</span></div>
                    <div className="flex flex-col items-end"><span className="text-[8px] text-stone-400 uppercase font-bold tracking-widest">Estoque</span><span className={`text-sm font-black ${p.estoque_atual <= 5 ? 'text-amber-600' : 'text-stone-900'}`}>{p.estoque_atual} un</span></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* MODAL DE EDIÇÃO/CADASTRO */}
      {showModal && editingProduto && (
        <div className="fixed inset-0 bg-stone-900/95 z-50 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center"><h2 className="text-lg font-black uppercase">{editingProduto.id ? 'Editar Produto' : 'Novo Produto'}</h2><button onClick={() => setShowModal(false)}><XCircle size={28} className="text-stone-300" /></button></div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1"><label className="text-[10px] font-bold uppercase text-stone-400">Nome do Item</label><input type="text" value={editingProduto.nome} onChange={(e) => setEditingProduto({...editingProduto, nome: e.target.value})} className="bg-stone-50 border p-3 rounded-xl text-sm" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1"><label className="text-[10px] font-bold uppercase text-stone-400">Preço (R$)</label><input type="number" step="0.01" value={editingProduto.preco} onChange={(e) => setEditingProduto({...editingProduto, preco: parseFloat(e.target.value)})} className="bg-stone-50 border p-3 rounded-xl text-sm" required /></div>
                <div className="flex flex-col gap-1"><label className="text-[10px] font-bold uppercase text-stone-400">Estoque Atual</label><input type="number" value={editingProduto.estoque_atual} onChange={(e) => setEditingProduto({...editingProduto, estoque_atual: parseInt(e.target.value)})} className="bg-stone-50 border p-3 rounded-xl text-sm" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1"><label className="text-[10px] font-bold uppercase text-stone-400">Volume (ml)</label><input type="number" value={editingProduto.volume_ml} onChange={(e) => setEditingProduto({...editingProduto, volume_ml: parseInt(e.target.value)})} className="bg-stone-50 border p-3 rounded-xl text-sm" /></div>
                <div className="flex flex-col gap-1"><label className="text-[10px] font-bold uppercase text-stone-400">Categoria</label><select value={editingProduto.categoria_id} onChange={(e) => setEditingProduto({...editingProduto, categoria_id: e.target.value})} className="bg-stone-50 border p-3 rounded-xl text-xs font-bold uppercase">{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              </div>
              <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-2 shadow-xl"><Save size={20} /> SALVAR ALTERAÇÕES</button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
