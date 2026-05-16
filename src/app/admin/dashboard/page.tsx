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
  Users, 
  Receipt, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    hoje: 0,
    abertas: 0,
    pedidos: 0,
    ticketMedio: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  if (!user || user.nivel_acesso !== 'admin') {
    router.push('/mesas');
    return null;
  }

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const { data: vendasHoje } = await supabase
      .from('comandas')
      .select('total_calculado')
      .eq('status', 'paga')
      .gte('fechada_em', today.toISOString());

    const { data: abertas } = await supabase
      .from('comandas')
      .select('total_calculado')
      .eq('status', 'aberta');

    const totalHoje = vendasHoje?.reduce((acc, c) => acc + (c.total_calculado || 0), 0) || 0;
    const totalAbertas = abertas?.reduce((acc, c) => acc + (c.total_calculado || 0), 0) || 0;
    
    setStats({
      hoje: totalHoje,
      abertas: totalAbertas,
      pedidos: vendasHoje?.length || 0,
      ticketMedio: vendasHoje?.length ? totalHoje / vendasHoje.length : 0
    });
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Dashboard" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Card Principal: Hoje */}
        <div className="bg-stone-900 rounded-3xl p-6 text-white shadow-xl flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Vendas de Hoje</span>
              <span className="text-4xl font-black tracking-tighter">{formatCurrency(stats.hoje)}</span>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} className="text-green-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase opacity-40">Ticket Médio</span>
              <span className="text-lg font-bold">{formatCurrency(stats.ticketMedio)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase opacity-40">Comandas Pagas</span>
              <span className="text-lg font-bold">{stats.pedidos}</span>
            </div>
          </div>
        </div>

        {/* Grid de Métricas Secundárias */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bistro-card p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Em Aberto</span>
            <span className="text-xl font-black text-stone-900">{formatCurrency(stats.abertas)}</span>
          </div>
          <div className="bistro-card p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Projeção Mês</span>
            <span className="text-xl font-black text-stone-900">--</span>
          </div>
        </div>

        {/* Gráfico Simulado (CSS Puro) */}
        <div className="bistro-card p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Desempenho Semanal</span>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          
          <div className="flex items-end justify-between h-32 gap-2">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-500 ${i === 3 ? 'bg-stone-900' : 'bg-stone-100'}`} 
                  style={{ height: `${h}%` }} 
                />
                <span className="text-[8px] font-bold text-stone-400 uppercase">{['S','T','Q','Q','S','S','D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de Fechamento de Caixa */}
        <button 
          className="w-full bg-white border-2 border-stone-900 text-stone-900 p-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:bg-stone-900 active:text-white transition-all shadow-md mt-4"
        >
          <DollarSign size={20} />
          GERAR RELATÓRIO DE FECHAMENTO
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

function Clock({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
