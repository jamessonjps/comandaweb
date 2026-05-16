"use client";

import React, { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { Receipt, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ComandaCaixa {
  id: string;
  mesa_id: string;
  total_calculado: number;
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
      .order('status', { ascending: false }); // 'fechando' primeiro

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
    const forma = confirm("Confirmar pagamento em DINHEIRO?");
    if (!forma) return;

    try {
      const { error } = await supabase
        .from('comandas')
        .update({ 
          status: 'paga', 
          fechada_em: new Date().toISOString(),
          forma_pagamento: 'dinheiro' 
        })
        .eq('id', comandaId);

      if (error) throw error;

      await supabase
        .from('mesas')
        .update({ status: 'livre' })
        .eq('id', mesaId);

      alert("Comanda fechada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao fechar comanda.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-base pb-32">
      <AppHeader title="Caixa" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-border flex flex-col gap-1">
            <span className="text-[10px] text-text-muted uppercase font-bold">Em Aberto</span>
            <span className="text-xl font-black text-text-primary">{comandas.length}</span>
          </div>
          <div className="bg-bg-surface p-4 rounded-2xl border border-border flex flex-col gap-1">
            <span className="text-[10px] text-text-muted uppercase font-bold">Total Pendente</span>
            <span className="text-xl font-black text-accent">
              {formatCurrency(comandas.reduce((acc, c) => acc + c.total_calculado, 0))}
            </span>
          </div>
        </div>

        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest px-1">
          Comandas Ativas
        </h2>

        <div className="flex flex-col gap-4">
          {comandas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-50">
              <CheckCircle size={48} className="mb-2" />
              <span>Nenhuma comanda aberta</span>
            </div>
          ) : (
            comandas.map((comanda) => (
              <Card key={comanda.id} className={`flex flex-col gap-4 ${comanda.status === 'fechando' ? 'border-warning' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-text-primary">Mesa {comanda.mesa.numero}</span>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Clock size={12} />
                      <span>Aberta em {new Date(comanda.aberta_em).toLocaleTimeString([], { hour: '2d', minute: '2d' })}</span>
                    </div>
                  </div>
                  <Badge variant={comanda.status === 'fechando' ? 'warning' : 'info'}>
                    {comanda.status === 'fechando' ? 'AGUARDANDO PAGAMENTO' : 'EM CONSUMO'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase font-bold">Total</span>
                    <span className="text-xl font-black text-accent">{formatCurrency(comanda.total_calculado)}</span>
                  </div>
                  <Button 
                    onClick={() => handleFecharPagamento(comanda.id, comanda.mesa_id)}
                    variant={comanda.status === 'fechando' ? 'primary' : 'secondary'}
                    className="px-6"
                  >
                    <Receipt size={18} />
                    Receber
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
