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
    <div className="min-h-screen bg-amber-50 pb-32 font-serif">
      <AppHeader title="Caixa" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Resumo Rápido Estilo Gravura */}
        <div className="grid grid-cols-2 gap-6">
          <div className="woodcut-card bg-amber-100 flex flex-col gap-1 p-4">
            <span className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Abertas</span>
            <span className="text-2xl font-display font-black text-amber-950">{comandas.length}</span>
          </div>
          <div className="woodcut-card bg-amber-100 flex flex-col gap-1 p-4">
            <span className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Pendente</span>
            <span className="text-xl font-display font-black text-amber-950 leading-tight">
              {formatCurrency(comandas.reduce((acc, c) => acc + c.total, 0))}
            </span>
          </div>
        </div>

        <h2 className="text-sm font-display font-black text-amber-950 uppercase tracking-[0.2em] px-1 border-b-2 border-amber-950 pb-2">
          Comandas Ativas
        </h2>

        <div className="flex flex-col gap-6">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-amber-950 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comandas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-amber-900/30">
              <CheckCircle size={64} className="mb-4" />
              <span className="font-display font-black uppercase tracking-widest">Tudo em dia!</span>
            </div>
          ) : (
            comandas.map((comanda) => (
              <div key={comanda.id} className="woodcut-card bg-white flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-3xl font-display font-black text-amber-950">MESA {comanda.mesa.numero}</span>
                    <div className="flex items-center gap-2 text-[10px] text-amber-900 font-bold uppercase tracking-wider mt-1">
                      <Clock size={12} />
                      <span>Desde {new Date(comanda.aberta_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>
                    {comanda.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-end pt-4 border-t-2 border-amber-950 border-dashed">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Total</span>
                    <span className="text-2xl font-display font-black text-amber-950">{formatCurrency(comanda.total)}</span>
                  </div>
                  <Button 
                    onClick={() => handleFecharPagamento(comanda.id, comanda.mesa_id)}
                    variant={comanda.status === 'fechando' ? 'primary' : 'secondary'}
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
