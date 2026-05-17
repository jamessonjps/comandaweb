"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useRealtimeMesas } from '@/hooks/useRealtimeMesas';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

function MesasContent() {
  const { mesas, isLoading, refresh } = useRealtimeMesas();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAssigning = searchParams.get('assign') === 'true';

  const [activeShift, setActiveShift] = useState<any>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);

  // Consultar estado ativo do caixa
  useEffect(() => {
    const checkActiveShift = async () => {
      try {
        const { data } = await supabase
          .from('turnos_caixa')
          .select('*')
          .eq('status', 'aberto')
          .limit(1)
          .maybeSingle();
        setActiveShift(data || null);
      } catch (err) {
        console.error('Erro ao verificar caixa:', err);
      } finally {
        setIsShiftLoading(false);
      }
    };
    checkActiveShift();
  }, []);

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
        
        {/* Banner Informativo do Status do Caixa */}
        {!isShiftLoading && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border shadow-sm animate-in slide-in-from-top duration-300
            ${activeShift 
              ? 'bg-emerald-50 border-emerald-100/50 text-emerald-800' 
              : 'bg-red-50 border-red-100/50 text-red-800'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse
                ${activeShift ? 'bg-emerald-500' : 'bg-red-500'}`} 
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  {activeShift ? '🟢 Caixa do Dia Aberto' : '🔴 Caixa Fechado'}
                </span>
                <span className="text-[8px] font-bold uppercase opacity-80">
                  {activeShift 
                    ? `Operador: ${activeShift.aberto_por || 'Sistema'} | Aberto às ${new Date(activeShift.aberto_em).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` 
                    : 'Abertura de atendimentos temporariamente bloqueada'}
                </span>
              </div>
            </div>
            <span className="text-[8px] font-black uppercase px-2 py-1 bg-white rounded-lg shadow-sm border border-stone-100 tracking-widest">
              {activeShift ? 'Operando' : 'Bloqueado'}
            </span>
          </div>
        )}

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
          {mesas.map((mesa) => {
            const isMesaLivre = mesa.status === 'livre';
            const showRedForLivre = isMesaLivre && !activeShift; // Se caixa fechado, livre fica vermelho
            return (
              <div
                key={mesa.id}
                onClick={() => router.push(`/mesas/${mesa.id}`)}
                className={`bistro-card flex flex-col items-center justify-center gap-2 aspect-square relative active:scale-95 transition-all cursor-pointer border-stone-200/60 shadow-sm hover:shadow-md
                  ${isAssigning ? 'ring-2 ring-amber-500 ring-offset-4' : ''}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border border-stone-100 bg-stone-50 flex items-center justify-center font-display font-black text-lg text-stone-900 shadow-inner">
                    {mesa.numero.toString().padStart(2, '0')}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-colors duration-300
                    ${showRedForLivre 
                      ? 'bg-red-600' 
                      : mesa.status === 'livre' 
                        ? 'bg-green-500' 
                        : mesa.status === 'ocupada' 
                          ? 'bg-red-500' 
                          : 'bg-amber-500'}`} 
                  />
                </div>
                
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 text-center px-1 line-clamp-1">
                    {showRedForLivre ? 'Bloqueado' : (mesa.cliente_nome || mesa.status)}
                  </span>
                  {(mesa.total_parcial || 0) > 0 && (
                    <span className="text-[10px] font-black text-stone-900">
                      {formatCurrency(mesa.total_parcial || 0)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
