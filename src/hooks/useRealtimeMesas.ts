"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MesaStatus } from '@/components/mesas/MesaCard';

export interface Mesa {
  id: string;
  numero: number;
  status: MesaStatus;
  capacidade: number;
  setor: string;
  // Esses campos viriam de um join com comandas abertas
  total_parcial?: number;
  aberta_em?: string;
  cliente_nome?: string;
}

export function useRealtimeMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');

  const fetchMesas = useCallback(async () => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setConnectionStatus('offline');
      }
    }, 10000); // 10 segundos de timeout de segurança

    try {
      // Query simplificada para o MVP
      const { data, error } = await supabase
        .from('mesas')
        .select(`
          *,
          comandas(id, total_calculado, aberta_em, status, clientes(nome))
        `)
        .order('numero', { ascending: true });

      if (error) throw error;

      const formattedMesas = data.map((m: any) => {
        const comandaAtiva = m.comandas?.find((c: any) => c.status === 'aberta' || c.status === 'fechando');
        return {
          ...m,
          total_parcial: comandaAtiva?.total_calculado || 0,
          aberta_em: comandaAtiva?.aberta_em,
          cliente_nome: comandaAtiva?.clientes?.nome
        };
      });

      setMesas(formattedMesas);
      setConnectionStatus('online');
    } catch (err) {
      console.error('Erro ao buscar mesas:', err);
      setConnectionStatus('offline');
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchMesas();

    const channel = supabase
      .channel('public:mesas-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'mesas' }, 
        () => fetchMesas()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comandas' }, 
        () => fetchMesas()
      )
      .on('system', {}, (payload: any) => {
        if (payload.status === 'CHANNEL_ERROR') setConnectionStatus('offline');
        if (payload.status === 'SUBSCRIBED') setConnectionStatus('online');
      })
      .subscribe();

    // Fallback: Polling a cada 30 segundos se estiver offline
    const interval = setInterval(() => {
      if (connectionStatus === 'offline') {
        setConnectionStatus('reconnecting');
        fetchMesas();
      }
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchMesas, connectionStatus]);

  return { mesas, isLoading, connectionStatus, refresh: fetchMesas };
}
