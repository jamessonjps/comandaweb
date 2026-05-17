"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria_id: string;
  categoria?: string; // Mapeado no hook
  volume_ml?: number;
  estoque_atual?: number;
  preco_compra?: number;
  disponivel: boolean;
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*, categorias(nome)')
          .eq('disponivel', true);

        if (error) throw error;

        const mappedData = (data || []).map(p => ({
          ...p,
          categoria: p.categorias?.nome || 'Sem Categoria'
        })) as Produto[];

        // Filtrar produtos com estoque esgotado (estoque_atual <= 0)
        // Se estoque_atual for nulo ou indefinido, considera disponível (sem controle de estoque)
        const activeProdutos = mappedData.filter(p => 
          p.estoque_atual === null || 
          p.estoque_atual === undefined || 
          p.estoque_atual > 0
        );

        setProdutos(activeProdutos);
        
        // Extrair categorias únicas de produtos ativos
        const uniqueCats = Array.from(new Set(activeProdutos.map(p => p.categoria)));
        setCategorias(uniqueCats as string[]);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { produtos, categorias, isLoading };
}
