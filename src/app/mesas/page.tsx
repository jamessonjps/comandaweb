"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { useRealtimeMesas } from '@/hooks/useRealtimeMesas';
import { useAuthStore } from '@/store/auth.store';
import { UtensilsIcon, Search, Receipt } from 'lucide-react';

export default function MesasPage() {
  const { mesas, isLoading } = useRealtimeMesas();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-20 font-serif">
      <AppHeader title="Mapa de Mesas" />

      <main className="px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              onClick={() => router.push(`/mesas/${mesa.id}`)}
              className="woodcut-card flex flex-col items-center justify-center gap-4 aspect-square active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer group"
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full border-2 border-amber-950 flex items-center justify-center font-display font-black text-2xl
                  ${mesa.status === 'livre' ? 'bg-green-100' : mesa.status === 'ocupada' ? 'bg-red-100' : 'bg-yellow-100'}`}
                >
                  {mesa.id}
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-amber-950
                  ${mesa.status === 'livre' ? 'bg-green-600' : mesa.status === 'ocupada' ? 'bg-red-600' : 'bg-yellow-500'}`} 
                />
              </div>
              <span className="font-display font-black text-xs uppercase tracking-widest text-amber-900">
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
