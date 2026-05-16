"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useRealtimeMesas } from '@/hooks/useRealtimeMesas';
import { useAuthStore } from '@/store/auth.store';
import { UtensilsIcon, Search, Receipt } from 'lucide-react';

export default function MesasPage() {
  const { mesas, isLoading } = useRealtimeMesas();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 font-sans">
      <AppHeader title="Mapa de Mesas" />

      <main className="px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              onClick={() => router.push(`/mesas/${mesa.id}`)}
              className="bistro-card bistro-card-hover flex flex-col items-center justify-center gap-4 aspect-square"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border border-stone-100 bg-white flex items-center justify-center font-display font-black text-2xl shadow-inner text-stone-900">
                  {mesa.numero.toString().padStart(2, '0')}
                </div>
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-4 border-stone-50
                  ${mesa.status === 'livre' ? 'bg-green-500' : mesa.status === 'ocupada' ? 'bg-red-500' : 'bg-amber-500'}`} 
                />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 text-center px-2 line-clamp-1">
                {mesa.cliente_nome ? (
                  <span className="text-stone-900">{mesa.cliente_nome}</span>
                ) : (
                  `Mesa ${mesa.status}`
                )}
              </span>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
