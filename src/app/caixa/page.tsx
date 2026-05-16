"use client";

import React, { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { Receipt, CheckCircle, Clock } from 'lucide-react';

interface ComandaCaixa {
  id: string;
  mesa_id: string;
  total: number;
  status: string;
  aberta_em: string;
  mesa: {
    numero: number;
  };
}

export default function CaixaDashboardPage() {
  const [comandas, setComandas] = useState<ComandaCaixa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComandasAtivas = async () => {
    const { data, error } = await supabase
      .from('comandas')
      .select('*, mesa:mesas(numero)')
      .in('status', ['aberta', 'fechando'])
      .order('status', { ascending: false });

    if (!error) setComandas(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComandasAtivas();
    const channel = supabase.channel('caixa-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comandas' }, () => fetchComandasAtivas())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleFecharPagamento = async (comandaId: string, mesaId: string) => {
    const forma = confirm("CONFIRMAR PAGAMENTO?");
    if (!forma) return;

    try {
      const { error } = await supabase
        .from('comandas')
        .update({ 
          status_pagamento: 'Pago',
          status: 'paga'
        })
        .eq('id', comandaId);

      if (error) throw error;

      await supabase
        .from('mesas')
        .update({ status: 'livre' })
        .eq('id', mesaId);

      alert("PAGAMENTO REGISTRADO!");
    } catch (err) {
      console.error(err);
      alert("ERRO AO PROCESSAR.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Caixa" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Resumo Rápido Moderno */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bistro-card flex flex-col gap-1 p-4 shadow-sm">
            <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Abertas</span>
            <span className="text-2xl font-black text-stone-900">{comandas.length}</span>
          </div>
          <div className="bistro-card flex flex-col gap-1 p-4 shadow-sm border-stone-100 bg-white">
            <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Pendente</span>
            <span className="text-xl font-black text-stone-900 leading-tight">
              {formatCurrency(comandas.reduce((acc, c) => acc + c.total, 0))}
            </span>
          </div>
        </div>

        <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1">
          Comandas Ativas
        </h2>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comandas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-200">
              <CheckCircle size={64} className="mb-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Tudo em dia!</span>
            </div>
          ) : (
            comandas.map((comanda) => (
              <div key={comanda.id} className="bistro-card flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-2xl font-extrabold text-stone-900 tracking-tighter">MESA {comanda.mesa.numero.toString().padStart(2, '0')}</span>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-1">
                      <Clock size={12} />
                      <span>{new Date(comanda.aberta_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>
                    {comanda.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-end pt-5 border-t border-stone-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">A Pagar</span>
                    <span className="text-2xl font-black text-stone-900">{formatCurrency(comanda.total)}</span>
                  </div>
                  <Button 
                    onClick={() => handleFecharPagamento(comanda.id, comanda.mesa_id)}
                    variant={comanda.status === 'fechando' ? 'primary' : 'secondary'}
                    className="h-12 px-4"
                  >
                    <Receipt size={18} />
                    RECEBER
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
