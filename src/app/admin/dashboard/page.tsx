"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { 
  TrendingUp, 
  Receipt, 
  DollarSign, 
  Package,
  AlertTriangle,
  ArrowRight,
  PieChart,
  ShoppingBag,
  Clock
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    hoje: 0,
    abertas: 0,
    pedidos: 0,
    ticketMedio: 0,
    itensCriticos: 0,
    estoqueTotal: 0
  });
  const [pagamentosPorMetodo, setPagamentosPorMetodo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
      router.push('/mesas');
    }
  }, [user]);

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Vendas Hoje
    const { data: vendasHoje } = await supabase
      .from('comandas')
      .select('total_calculado')
      .eq('status', 'paga')
      .gte('fechada_em', today.toISOString());

    // 2. Comandas Abertas
    const { data: abertas } = await supabase
      .from('comandas')
      .select('total_calculado')
      .eq('status', 'aberta');

    // 3. Pagamentos por Método (Unificado)
    const { data: pagamentos } = await supabase
      .from('pagamentos_comanda')
      .select('metodo, valor, comandas!inner(fechada_em)')
      .gte('comandas.fechada_em', today.toISOString());

    // 4. Estoque
    const { data: produtos } = await supabase
      .from('produtos')
      .select('nome, estoque_atual');

    const totalHoje = vendasHoje?.reduce((acc, c) => acc + (c.total_calculado || 0), 0) || 0;
    const totalAbertas = abertas?.reduce((acc, c) => acc + (c.total_calculado || 0), 0) || 0;
    const criticos = produtos?.filter(p => (p.estoque_atual || 0) <= 5).length || 0;
    
    // Processar pagamentos
    const metodos = pagamentos?.reduce((acc: any, p: any) => {
      acc[p.metodo] = (acc[p.metodo] || 0) + p.valor;
      return acc;
    }, {});

    setPagamentosPorMetodo(Object.entries(metodos || {}).map(([m, v]) => ({ metodo: m, valor: v })));
    
    setStats({
      hoje: totalHoje,
      abertas: totalAbertas,
      pedidos: vendasHoje?.length || 0,
      ticketMedio: vendasHoje?.length ? totalHoje / vendasHoje.length : 0,
      itensCriticos: criticos,
      estoqueTotal: produtos?.length || 0
    });
    setIsLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  if (isLoading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Painel Gerencial" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Faturamento Principal */}
        <div className="bg-stone-900 rounded-3xl p-6 text-white shadow-xl flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Faturamento Bruto (Hoje)</span>
              <span className="text-4xl font-black tracking-tighter">{formatCurrency(stats.hoje)}</span>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} className="text-green-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex flex-col"><span className="text-[9px] font-bold uppercase opacity-40">Ticket Médio</span><span className="text-lg font-black">{formatCurrency(stats.ticketMedio)}</span></div>
            <div className="flex flex-col"><span className="text-[9px] font-bold uppercase opacity-40">Total de Mesas</span><span className="text-lg font-black">{stats.pedidos}</span></div>
          </div>
        </div>

        {/* Card de Estoque (NOVO) */}
        <div className="bistro-card p-6 border-l-4 border-l-amber-500 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Package size={24} /></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Estoque Crítico</span>
                <span className="text-xl font-black text-stone-900">{stats.itensCriticos} itens acabando</span>
              </div>
           </div>
           <button onClick={() => router.push('/admin/cardapio')} className="text-stone-300 hover:text-stone-900"><ArrowRight size={20} /></button>
        </div>

        {/* Relatório por Meio de Pagamento */}
        <div className="bistro-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2"><PieChart size={14} className="text-stone-400" /><h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Resumo de Recebimentos</h3></div>
          <div className="flex flex-col gap-3">
             {pagamentosPorMetodo.length === 0 ? <span className="text-center py-4 text-[10px] font-bold text-stone-300 uppercase">Nenhum pagamento hoje</span> : pagamentosPorMetodo.map((m, i) => (
               <div key={i} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl">
                 <span className="text-xs font-bold uppercase text-stone-600">{m.metodo.replace('_', ' ')}</span>
                 <span className="text-sm font-black text-stone-900">{formatCurrency(m.valor)}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Métricas de Operação */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bistro-card p-5 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Clock size={16} /></div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Consumo em Aberto</span>
            <span className="text-xl font-black text-stone-900">{formatCurrency(stats.abertas)}</span>
          </div>
          <div className="bistro-card p-5 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><ShoppingBag size={16} /></div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Mix de Produtos</span>
            <span className="text-xl font-black text-stone-900">{stats.estoqueTotal}</span>
          </div>
        </div>

        {/* Alerta de Urgência */}
        {stats.itensCriticos > 0 && (
          <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
            <AlertTriangle className="text-red-500" size={20} />
            <span className="text-[10px] font-bold text-red-600 uppercase">Atenção: Repor estoque imediatamente!</span>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
