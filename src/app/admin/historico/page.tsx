"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { 
  History, 
  Calendar, 
  Search, 
  XCircle, 
  ListFilter, 
  Receipt, 
  CreditCard,
  MessageCircle,
  RotateCcw,
  Lock,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth.store';

export default function AdminHistoricoPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [comandas, setComandas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'hoje' | 'ontem' | '7dias' | 'customizado'>('hoje');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Estados para Modal de Detalhes
  const [selectedComanda, setSelectedComanda] = useState<any>(null);
  const [itensDaComanda, setItensDaComanda] = useState<any[]>([]);
  const [pagamentosDaComanda, setPagamentosDaComanda] = useState<any[]>([]);
  
  // Estado para PIN de Reabertura
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Proteção de rota
  useEffect(() => {
    if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
      router.push('/mesas');
    }
  }, [user]);

  const fetchComandas = async () => {
    setIsLoading(true);
    let query = supabase
      .from('comandas')
      .select('*, mesa:mesas(numero), clientes(nome, telefone, whatsapp)')
      .eq('status', 'paga');

    const now = new Date();
    
    if (filterType === 'hoje') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      query = query.gte('fechada_em', today.toISOString());
    } else if (filterType === 'ontem') {
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      
      const yesterdayEnd = new Date(now);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);
      
      query = query.gte('fechada_em', yesterdayStart.toISOString()).lte('fechada_em', yesterdayEnd.toISOString());
    } else if (filterType === '7dias') {
      const sevenDays = new Date(now);
      sevenDays.setDate(sevenDays.getDate() - 7);
      sevenDays.setHours(0, 0, 0, 0);
      query = query.gte('fechada_em', sevenDays.toISOString());
    } else if (filterType === 'customizado') {
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        query = query.gte('fechada_em', start.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        query = query.lte('fechada_em', end.toISOString());
      }
    }

    const { data, error } = await query.order('fechada_em', { ascending: false });
    
    if (!error) {
      setComandas(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComandas();
  }, [filterType, startDate, endDate]);

  const handleSelecionarComanda = async (comanda: any) => {
    setSelectedComanda(comanda);
    
    // Buscar itens
    const { data: itens } = await supabase
      .from('itens_pedido')
      .select('*, produto:produtos(nome)')
      .eq('comanda_id', comanda.id)
      .neq('status_item', 'cancelado');
      
    setItensDaComanda(itens || []);

    // Buscar pagamentos
    const { data: pagamentos } = await supabase
      .from('pagamentos_comanda')
      .select('*')
      .eq('comanda_id', comanda.id);

    setPagamentosDaComanda(pagamentos || []);
  };

  const handleReabrirComanda = () => {
    setShowPinModal(true);
    setPinInput('');
  };

  const verifyPin = async () => {
    if (pinInput === '5678') {
      try {
        // Reabrir comanda no banco
        await supabase
          .from('comandas')
          .update({ status: 'aberta', fechada_em: null })
          .eq('id', selectedComanda.id);

        // Ocupar mesa novamente
        await supabase
          .from('mesas')
          .update({ status: 'ocupada' })
          .eq('id', selectedComanda.mesa_id);

        alert('COMANDA REABERTA COM SUCESSO!');
        setShowPinModal(false);
        setSelectedComanda(null);
        fetchComandas();
      } catch (err: any) {
        alert('ERRO AO REABRIR COMANDA: ' + err.message);
      }
    } else {
      alert('PIN INCORRETO! APENAS O GERENTE PODE AUTORIZAR A REABERTURA.');
      setPinInput('');
    }
  };

  const filteredComandas = comandas.filter((c) => {
    const term = search.toLowerCase();
    const matchesClient = c.clientes?.nome?.toLowerCase().includes(term);
    const matchesMesa = c.mesa?.numero?.toString().includes(term);
    return !search || matchesClient || matchesMesa;
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Histórico de Vendas" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        
        {/* Filtros de Período */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setFilterType('hoje')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border
                ${filterType === 'hoje' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:text-stone-900'}`}
            >
              Hoje
            </button>
            <button
              onClick={() => setFilterType('ontem')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border
                ${filterType === 'ontem' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:text-stone-900'}`}
            >
              Ontem
            </button>
            <button
              onClick={() => setFilterType('7dias')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border
                ${filterType === '7dias' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:text-stone-900'}`}
            >
              Últimos 7 Dias
            </button>
            <button
              onClick={() => setFilterType('customizado')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border
                ${filterType === 'customizado' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:text-stone-900'}`}
            >
              Customizado
            </button>
          </div>

          {filterType === 'customizado' && (
            <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-stone-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-stone-400 uppercase tracking-wider">Data de Início</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold text-stone-900 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-stone-400 uppercase tracking-wider">Data de Fim</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold text-stone-900 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou mesa..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none shadow-sm placeholder:text-stone-400 font-medium"
          />
        </div>

        {/* Resumo Financeiro do Período */}
        <div className="bistro-card bg-stone-900 text-white p-5 flex flex-col gap-2 shadow-xl">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
            <Receipt size={12} /> Total de Vendas no Período
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black">{formatCurrency(filteredComandas.reduce((acc, c) => acc + (c.total_pago || c.total_calculado || 0), 0))}</span>
            <span className="text-[10px] font-bold opacity-60 uppercase">{filteredComandas.length} Comandas Pagas</span>
          </div>
        </div>

        {/* Listagem de Comandas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <History size={16} className="text-stone-400" />
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Comandas Registradas</h2>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredComandas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300 gap-2">
              <XCircle size={40} className="opacity-40" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Nenhuma comanda encontrada</span>
            </div>
          ) : (
            filteredComandas.map((c) => (
              <div 
                key={c.id} 
                onClick={() => handleSelecionarComanda(c)}
                className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:border-stone-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center font-black text-sm">
                    {c.mesa?.numero?.toString().padStart(2, '0') || 'S/M'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase text-stone-900">{c.clientes?.nome || 'Mesa Local'}</span>
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wide flex items-center gap-1">
                      <Clock size={10} /> Fechada às {new Date(c.fechada_em).toLocaleDateString()} {new Date(c.fechada_em).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-stone-900">{formatCurrency(c.total_pago || c.total_calculado)}</span>
                    <span className="text-[8px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Paga</span>
                  </div>
                  <ChevronRight size={16} className="text-stone-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL DE DETALHES DA COMANDA */}
      {selectedComanda && (
        <div className="fixed inset-0 bg-stone-900/95 z-50 p-6 flex flex-col gap-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-lg font-black uppercase flex items-center gap-2">
              <Receipt size={20} /> Detalhes da Mesa {selectedComanda.mesa?.numero || 'Local'}
            </h2>
            <button onClick={() => setSelectedComanda(null)}>
              <XCircle size={32} className="opacity-40 hover:opacity-100 transition-opacity" />
            </button>
          </div>
          
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
            {/* Infos do Cliente */}
            <div className="flex flex-col gap-1 pb-4 border-b border-stone-100">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Cliente / Atendimento</span>
              <span className="text-sm font-black text-stone-950 uppercase">{selectedComanda.clientes?.nome || 'Consumo Local'}</span>
              {selectedComanda.clientes?.whatsapp && (
                <span className="text-[10px] text-stone-500 font-medium">WhatsApp: {selectedComanda.clientes?.whatsapp}</span>
              )}
            </div>

            {/* Listagem de Itens */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-2 mb-2">
                <ListFilter size={14} className="text-stone-400" />
                <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">Itens Consumidos</span>
              </div>
              {itensDaComanda.length === 0 ? (
                <span className="text-center py-6 text-[10px] font-bold text-stone-300 uppercase">Nenhum item lançado</span>
              ) : (
                itensDaComanda.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0 text-[10px] font-bold uppercase text-stone-600">
                    <span>{item.quantidade}x {item.produto?.nome}</span>
                    <span className="text-stone-900 font-black">
                      {formatCurrency(item.preco_unitario * item.quantidade)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal, Taxa, Total */}
            <div className="flex flex-col gap-2 py-4 border-b border-stone-100">
              <div className="flex justify-between text-xs font-bold text-stone-400 uppercase">
                <span>Subtotal dos Itens</span>
                <span>{formatCurrency(selectedComanda.total_calculado)}</span>
              </div>
              {selectedComanda.taxa_servico_inclusa && (
                <div className="flex justify-between text-xs font-bold text-stone-400 uppercase">
                  <span>Taxa de Serviço (10%)</span>
                  <span>{formatCurrency(selectedComanda.valor_taxa_servico || (selectedComanda.total_calculado * 0.1))}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Valor Pago</span>
                <span className="text-2xl font-black text-stone-900">{formatCurrency(selectedComanda.total_pago || selectedComanda.total_calculado)}</span>
              </div>
            </div>

            {/* Pagamentos Efetuados */}
            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
                <CreditCard size={10} /> Métodos de Pagamento
              </span>
              <div className="flex flex-col gap-1.5">
                {pagamentosDaComanda.length === 0 ? (
                  <div className="bg-stone-50 p-3 rounded-xl text-center text-[10px] font-bold text-stone-400 uppercase">
                    Registrado sem dados de divisão
                  </div>
                ) : (
                  pagamentosDaComanda.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-stone-50 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase text-stone-600">
                      <span>{p.metodo}</span>
                      <span className="text-stone-900 font-black">{formatCurrency(p.valor)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ações Administrativas */}
            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={handleReabrirComanda} 
                className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <RotateCcw size={16} /> REABRIR COMANDA (REQUER PIN)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN DE CONFIRMAÇÃO DE REABERTURA */}
      {showPinModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-900">
              <Lock size={20} />
            </div>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm font-black uppercase tracking-widest">Autorização do Gerente</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">Apenas o Gerente pode reabrir contas</p>
            </div>
            <input 
              type="password" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
              className="w-full bg-stone-50 border rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-stone-900" 
              autoFocus 
            />
            <div className="grid grid-cols-2 gap-3 w-full">
              <button 
                onClick={() => setShowPinModal(false)} 
                className="py-3 text-[10px] font-bold uppercase text-stone-400 bg-stone-50 rounded-xl"
              >
                Cancelar
              </button>
              <button 
                onClick={verifyPin} 
                className="py-3 text-[10px] font-bold uppercase text-white bg-stone-900 rounded-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
