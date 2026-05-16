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

        setProdutos(mappedData);
        
        // Extrair categorias únicas
        const uniqueCats = Array.from(new Set(mappedData.map(p => p.categoria)));
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
