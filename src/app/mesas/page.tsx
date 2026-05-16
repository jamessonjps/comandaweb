"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useRealtimeMesas } from '@/hooks/useRealtimeMesas';
import { useAuthStore } from '@/store/auth.store';
import { 
  RefreshCw 
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function MesasPage() {
  const { mesas, isLoading, refresh } = useRealtimeMesas();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Mapa de Mesas" />

      <main className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Status das Mesas</h2>
          <button 
            onClick={() => refresh()}
            className="w-8 h-8 rounded-lg bg-white border border-stone-200 text-stone-600 flex items-center justify-center active:rotate-180 transition-all duration-500"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              onClick={() => router.push(`/mesas/${mesa.id}`)}
              className="bistro-card flex flex-col items-center justify-center gap-2 aspect-square relative active:scale-95 transition-all cursor-pointer border-stone-100"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border border-stone-100 bg-stone-50 flex items-center justify-center font-display font-black text-lg text-stone-900 shadow-inner">
                  {mesa.numero.toString().padStart(2, '0')}
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                  ${mesa.status === 'livre' ? 'bg-green-500' : mesa.status === 'ocupada' ? 'bg-red-500' : 'bg-amber-500'}`} 
                />
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400 text-center px-1 line-clamp-1">
                  {mesa.cliente_nome || mesa.status}
                </span>
                {(mesa.total_parcial || 0) > 0 && (
                  <span className="text-[10px] font-black text-stone-900 mt-0.5">
                    {formatCurrency(mesa.total_parcial || 0)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
