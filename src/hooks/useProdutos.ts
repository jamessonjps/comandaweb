"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  ativo: boolean;
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
          .select('*')
          .eq('ativo', true);

        if (error) throw error;

        setProdutos(data || []);
        
        // Extrair categorias únicas
        const uniqueCats = Array.from(new Set((data || []).map(p => p.categoria)));
        setCategorias(uniqueCats);
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
