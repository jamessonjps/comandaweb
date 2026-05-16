"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria_id: string;
  imagem_url?: string;
}

export interface Categoria {
  id: string;
  nome: string;
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('produtos').select('*').eq('disponivel', true).order('ordem', { ascending: true }),
          supabase.from('categorias').select('*').eq('ativo', true).order('ordem', { ascending: true })
        ]);

        if (prodRes.error) throw prodRes.error;
        if (catRes.error) throw catRes.error;

        setProdutos(prodRes.data || []);
        setCategorias(catRes.data || []);
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
