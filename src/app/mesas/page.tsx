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
                <div className={`w-16 h-16 rounded-full border-2 border-stone-100 flex items-center justify-center font-display font-black text-2xl shadow-inner
                  ${mesa.status === 'livre' ? 'bg-green-50 text-green-700' : mesa.status === 'ocupada' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
                >
                  {mesa.id}
                </div>
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-4 border-white
                  ${mesa.status === 'livre' ? 'bg-green-500' : mesa.status === 'ocupada' ? 'bg-red-500' : 'bg-amber-500'}`} 
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                {mesa.status}
              </span>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
