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
  Plus,
  XCircle,
  User,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  TrendingUp,
  UserCheck
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

  // Estados do Modal de Histórico
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [comandasHistoricas, setComandasHistoricas] = useState<any[]>([]);
  const [itensHistoricos, setItensHistoricos] = useState<Record<string, any[]>>({});
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [expandedComandaId, setExpandedComandaId] = useState<string | null>(null);

  // Proteção de rota
  if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
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

  // Buscar Histórico do Cliente Selecionado
  useEffect(() => {
    if (!selectedCliente) {
      setComandasHistoricas([]);
      setItensHistoricos({});
      setExpandedComandaId(null);
      return;
    }

    const fetchHistorico = async () => {
      setIsHistoryLoading(true);
      try {
        const { data: comandasData, error: errComandas } = await supabase
          .from('comandas')
          .select('*, mesa:mesas(numero)')
          .eq('cliente_id', selectedCliente.id)
          .order('aberta_em', { ascending: false });

        if (errComandas) throw errComandas;
        setComandasHistoricas(comandasData || []);

        if (comandasData && comandasData.length > 0) {
          const comandaIds = comandasData.map(c => c.id);
          const { data: itensData, error: errItens } = await supabase
            .from('itens_pedido')
            .select('*, produto:produtos(nome)')
            .in('comanda_id', comandaIds)
            .neq('status_item', 'cancelado');

          if (errItens) throw errItens;

          const grouped: Record<string, any[]> = {};
          (itensData || []).forEach(item => {
            if (!grouped[item.comanda_id]) {
              grouped[item.comanda_id] = [];
            }
            grouped[item.comanda_id].push(item);
          });
          setItensHistoricos(grouped);
        }
      } catch (err) {
        console.error('Erro ao buscar histórico:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchHistorico();
  }, [selectedCliente]);

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search)
  );

  const totalConsumido = comandasHistoricas.reduce(
    (acc, c) => acc + (c.total_pago || c.total_calculado || 0), 0
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
              className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-12 pr-4 text-sm text-stone-900 focus:outline-none shadow-sm font-medium"
            />
          </div>
          <button className="bg-stone-900 text-white p-3 rounded-xl shadow-md active:scale-95 transition-all">
            <UserPlus size={24} />
          </button>
        </div>

        {/* Resumo de Fiado */}
        <div className="bistro-card bg-stone-900 text-white flex flex-col gap-2 p-5 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
            <TrendingUp size={120} />
          </div>
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
            <div className="flex flex-col items-center justify-center py-20 text-stone-300 gap-2">
              <AlertCircle size={40} className="opacity-40" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Nenhum cliente encontrado</span>
            </div>
          ) : (
            filteredClientes.map((cliente) => {
              const hasFiado = (cliente.total_fiado || 0) > 0;
              return (
                <div key={cliente.id} className="bistro-card flex flex-col gap-4 border-stone-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-stone-900 uppercase tracking-tight">{cliente.nome}</span>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Phone size={10} /> {cliente.telefone || 'Sem telefone'}
                      </span>
                    </div>
                    <button className="p-1 text-stone-300 hover:text-stone-900 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <div className="flex flex-col min-h-[32px]">
                      {hasFiado && (
                        <>
                          <span className="text-[8px] text-stone-400 uppercase font-black tracking-wider">Fiado Atual</span>
                          <span className="text-sm font-black text-red-600 tracking-tight">
                            {formatCurrency(cliente.total_fiado)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {cliente.whatsapp && (
                        <a 
                          href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center active:scale-90 transition-all border border-green-100/30"
                        >
                          <MessageCircle size={18} />
                        </a>
                      )}
                      <button 
                        onClick={() => setSelectedCliente(cliente)}
                        className="h-10 px-5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* MODAL DE HISTÓRICO E DETALHES (FICHA DO CLIENTE) */}
      {selectedCliente && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-3xl max-h-[85vh] md:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header do Slide-over */}
            <div className="px-6 py-5 bg-stone-900 text-white flex justify-between items-center relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                  <User size={20} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-wider">{selectedCliente.nome}</h3>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Ficha e Histórico</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCliente(null)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <XCircle size={28} />
              </button>
            </div>

            {/* Corpo do Slide-over */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Contatos */}
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Telefone / WhatsApp</span>
                  <span className="text-xs font-black text-stone-900">{selectedCliente.telefone || 'Não Informado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Débitos Ativos</span>
                  <span className={`text-xs font-black ${selectedCliente.total_fiado > 0 ? 'text-red-600' : 'text-stone-500'}`}>
                    {selectedCliente.total_fiado > 0 ? formatCurrency(selectedCliente.total_fiado) : 'Nenhum débito'}
                  </span>
                </div>
              </div>

              {/* Estatísticas Agregadas */}
              {isHistoryLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-3 border-stone-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-stone-50 p-4 rounded-2xl border flex flex-col items-center text-center gap-1">
                      <Calendar size={18} className="text-stone-400" />
                      <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-1">Visitas</span>
                      <span className="text-lg font-black text-stone-900">{comandasHistoricas.length}</span>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl border flex flex-col items-center text-center gap-1 col-span-2">
                      <ShoppingBag size={18} className="text-stone-400" />
                      <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-1">Consumo Total</span>
                      <span className="text-lg font-black text-emerald-600">{formatCurrency(totalConsumido)}</span>
                    </div>
                  </div>

                  {/* Listagem de Comandas */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                      <Clock size={14} className="text-stone-400" />
                      <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Histórico de Visitas</h4>
                    </div>

                    {comandasHistoricas.length === 0 ? (
                      <div className="text-center py-10 text-stone-300 font-bold uppercase text-[9px] tracking-wider bg-stone-50 rounded-2xl border border-dashed">
                        Nenhum atendimento finalizado
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {comandasHistoricas.map((c) => {
                          const isExpanded = expandedComandaId === c.id;
                          const itens = itensHistoricos[c.id] || [];
                          return (
                            <div 
                              key={c.id} 
                              className="bg-white rounded-2xl border border-stone-100 flex flex-col overflow-hidden shadow-sm hover:border-stone-200 transition-all"
                            >
                              {/* Header da Comanda */}
                              <div 
                                onClick={() => setExpandedComandaId(isExpanded ? null : c.id)}
                                className="p-4 flex items-center justify-between cursor-pointer active:bg-stone-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-stone-100 font-black text-xs text-stone-900 flex items-center justify-center">
                                    {c.mesa?.numero?.toString().padStart(2, '0') || 'S/M'}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-stone-900 uppercase">Atendimento</span>
                                    <span className="text-[8px] font-bold text-stone-400 uppercase">
                                      {new Date(c.aberta_em).toLocaleDateString()} {new Date(c.aberta_em).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs font-black text-stone-900">{formatCurrency(c.total_pago || c.total_calculado)}</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest
                                      ${c.status === 'paga' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                      {c.status}
                                    </span>
                                  </div>
                                  {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                                </div>
                              </div>

                              {/* Lista de Itens (Expandido) */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 bg-stone-50/50 border-t border-stone-50 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Itens Consumidos:</span>
                                  {itens.length === 0 ? (
                                    <span className="text-[9px] text-stone-300 font-bold uppercase">Nenhum item registrado</span>
                                  ) : (
                                    itens.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center text-[10px] font-bold uppercase text-stone-600 py-1 last:border-b-0 border-b border-dashed border-stone-100">
                                        <span>{item.quantidade}x {item.produto?.nome}</span>
                                        <span className="text-stone-900 font-black">{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Rodapé do Slide-over */}
            <div className="p-6 border-t bg-stone-50 flex justify-end">
              <button 
                onClick={() => setSelectedCliente(null)}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-98 transition-all"
              >
                Voltar aos Clientes
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
