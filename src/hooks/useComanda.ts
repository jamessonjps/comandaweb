"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ItemPedido {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario_congelado: number;
  status_item: 'pendente' | 'em_preparo' | 'entregue' | 'cancelado';
  observacao?: string;
  produto: {
    nome: string;
  };
}

export interface Comanda {
  id: string;
  mesa_id: string;
  status: 'aberta' | 'fechando' | 'paga' | 'cancelada';
  total_calculado: number;
  aberta_em: string;
  mesa: {
    numero: number;
  };
}

export function useComanda(mesaId: string) {
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComanda = async () => {
    try {
      // 1. Busca comanda ativa para a mesa
      const { data: comandaData, error: comandaError } = await supabase
        .from('comandas')
        .select('*, mesa:mesas(numero)')
        .eq('mesa_id', mesaId)
        .in('status', ['aberta', 'fechando'])
        .maybeSingle();

      if (comandaError) throw comandaError;

      if (comandaData) {
        setComanda(comandaData);
        
        // 2. Busca itens da comanda
        const { data: itensData, error: itensError } = await supabase
          .from('itens_pedido')
          .select('*, produto:produtos(nome)')
          .eq('comanda_id', comandaData.id)
          .order('criado_em', { ascending: false });

        if (itensError) throw itensError;
        setItens(itensData || []);
      } else {
        setComanda(null);
        setItens([]);
      }
    } catch (err) {
      console.error('Erro ao carregar comanda:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComanda();

    // Inscrição Realtime para itens de pedido
    const channel = supabase
      .channel(`comanda-${mesaId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'itens_pedido' }, 
        () => fetchComanda()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comandas', filter: `mesa_id=eq.${mesaId}` }, 
        () => fetchComanda()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mesaId]);

  return { comanda, itens, isLoading, refresh: fetchComanda };
}
