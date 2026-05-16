"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { 
  UserPlus, 
  Search, 
  Phone, 
  MessageCircle, 
  AlertCircle,
  MoreVertical,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  whatsapp: string;
  total_fiado: number;
}

export default function AdminClientesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Proteção de rota
  if (!user || user.nivel_acesso !== 'admin') {
    router.push('/mesas');
    return null;
  }

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });

    if (!error) setClientes(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search)
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Clientes" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Busca e Novo Cliente */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-12 pr-4 text-sm text-stone-900 focus:outline-none shadow-sm"
            />
          </div>
          <button className="bg-stone-900 text-white p-3 rounded-xl shadow-md active:scale-95 transition-all">
            <UserPlus size={24} />
          </button>
        </div>

        {/* Resumo de Fiado */}
        <div className="bistro-card bg-stone-900 text-white flex flex-col gap-2 p-5">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total em Aberto (Fiado)</span>
          <span className="text-3xl font-black">{formatCurrency(clientes.reduce((acc, c) => acc + c.total_fiado, 0))}</span>
        </div>

        {/* Lista de Clientes */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1">
            Base de Clientes
          </h2>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-200 gap-2">
              <AlertCircle size={48} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Nenhum cliente encontrado</span>
            </div>
          ) : (
            filteredClientes.map((cliente) => (
              <div key={cliente.id} className="bistro-card flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900 uppercase">{cliente.nome}</span>
                    <span className="text-xs text-stone-400">{cliente.telefone || 'Sem telefone'}</span>
                  </div>
                  <button className="p-1 text-stone-300 hover:text-stone-900">
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-stone-400 uppercase font-bold tracking-widest">Fiado Atual</span>
                    <span className={`text-sm font-black ${cliente.total_fiado > 0 ? 'text-red-600' : 'text-stone-900'}`}>
                      {formatCurrency(cliente.total_fiado)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {cliente.whatsapp && (
                      <a 
                        href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank"
                        className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <MessageCircle size={20} />
                      </a>
                    )}
                    <button className="h-10 px-4 bg-stone-100 text-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">
                      Ver Ficha
                    </button>
                  </div>
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
