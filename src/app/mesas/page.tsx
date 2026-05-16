"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MesaCard } from '@/components/mesas/MesaCard';
import { useRealtimeMesas } from '@/hooks/useRealtimeMesas';
import { WifiOff, Loader2, Search } from 'lucide-react';

export default function MesasPage() {
  const { mesas, isLoading, connectionStatus } = useRealtimeMesas();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base pb-32">
      <AppHeader title="Mesas" />
      
      {/* Barra de Status de Conexão */}
      {connectionStatus !== 'online' && (
        <div className="bg-danger/20 text-danger text-[10px] font-bold uppercase tracking-widest py-1 flex items-center justify-center gap-2">
          <WifiOff size={12} />
          <span>Modo Offline - Tentando reconectar...</span>
        </div>
      )}

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Filtros / Busca Simples */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar mesa ou setor..." 
            className="w-full bg-bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-2 gap-4">
          {mesas.map((mesa) => (
            <MesaCard
              key={mesa.id}
              numero={mesa.numero}
              status={mesa.status}
              capacidade={mesa.capacidade}
              setor={mesa.setor}
              totalParcial={mesa.total_parcial}
              abertaEm={mesa.aberta_em}
              onClick={() => router.push(`/mesas/${mesa.id}`)}
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
