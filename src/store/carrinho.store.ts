import { create } from 'zustand';

export interface CarrinhoItem {
  produto_id: string;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  observacao?: string;
}

interface CarrinhoState {
  itens: CarrinhoItem[];
  adicionarItem: (item: CarrinhoItem) => void;
  removerItem: (produtoId: string) => void;
  limparCarrinho: () => void;
  atualizarQuantidade: (produtoId: string, delta: number) => void;
  total: number;
}

export const useCarrinhoStore = create<CarrinhoState>((set, get) => ({
  itens: [],
  total: 0,
  adicionarItem: (item) => {
    const existing = get().itens.find(i => i.produto_id === item.produto_id);
    if (existing) {
      get().atualizarQuantidade(item.produto_id, item.quantidade);
    } else {
      set(state => ({ 
        itens: [...state.itens, item],
        total: state.total + (item.preco_unitario * item.quantidade)
      }));
    }
  },
  removerItem: (produtoId) => {
    const item = get().itens.find(i => i.produto_id === produtoId);
    if (!item) return;
    set(state => ({
      itens: state.itens.filter(i => i.produto_id !== produtoId),
      total: state.total - (item.preco_unitario * item.quantidade)
    }));
  },
  atualizarQuantidade: (produtoId, delta) => {
    set(state => {
      const newItens = state.itens.map(i => {
        if (i.produto_id === produtoId) {
          const newQty = Math.max(0, i.quantidade + delta);
          return { ...i, quantidade: newQty };
        }
        return i;
      }).filter(i => i.quantidade > 0);
      
      const newTotal = newItens.reduce((acc, i) => acc + (i.preco_unitario * i.quantidade), 0);
      return { itens: newItens, total: newTotal };
    });
  },
  limparCarrinho: () => set({ itens: [], total: 0 }),
}));
