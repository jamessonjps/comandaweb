"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useRealtimeMesas } from '@/hooks/useRealtimeMesas';
import { useAuthStore } from '@/store/auth.store';
import { 
  RefreshCw,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

function MesasContent() {
  const { mesas, isLoading, refresh } = useRealtimeMesas();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAssigning = searchParams.get('assign') === 'true';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title={isAssigning ? "Vincular Pedido" : "Mapa de Mesas"} />

      <main className="px-6 py-8">
        {isAssigning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300">
             <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-600" size={20} />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-amber-900 uppercase">Modo de Vinculação</span>
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Escolha uma mesa para o pedido</span>
                </div>
             </div>
             <button onClick={() => router.push('/mesas')} className="text-amber-900 opacity-40 hover:opacity-100"><XCircle size={24} /></button>
          </div>
        )}

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
              className={`bistro-card flex flex-col items-center justify-center gap-2 aspect-square relative active:scale-95 transition-all cursor-pointer
                ${isAssigning ? 'ring-2 ring-amber-500 ring-offset-4' : 'border-stone-100'}`}
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

export default function MesasPage() {
  return (
    <Suspense fallback={null}>
      <MesasContent />
    </Suspense>
  );
}
