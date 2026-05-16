"use client";

import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { 
  Receipt, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Plus,
  Smartphone,
  Trash2,
  MinusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function CaixaDashboardPage() {
  const [comandas, setComandas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComanda, setSelectedComanda] = useState<any>(null);
  
  // Estados para o Fechamento
  const [useTaxa, setUseTaxa] = useState(true);
  const [pagamentos, setPagamentos] = useState<{metodo: string, valor: number}[]>([]);
  const [metodoAtual, setMetodoAtual] = useState('dinheiro');
  const [valorAtual, setValorAtual] = useState('');

  const fetchComandasAtivas = async () => {
    const { data, error } = await supabase
      .from('comandas')
      .select('*, mesa:mesas(numero), clientes(nome, telefone, whatsapp)')
      .in('status', ['aberta', 'fechando'])
      .order('aberta_em', { ascending: false });

    if (!error) setComandas(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComandasAtivas();
    // Tempo real mais agressivo: ouve mesas, comandas e itens
    const channel = supabase.channel('caixa-global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comandas' }, () => fetchComandasAtivas())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itens_pedido' }, () => fetchComandasAtivas())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalComTaxa = (selectedComanda?.total_calculado || 0) * (useTaxa ? 1.1 : 1);
  const jaPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const faltaPagar = Math.max(0, totalComTaxa - jaPago);
  const troco = Math.max(0, jaPago - totalComTaxa);

  const handleAddPagamento = () => {
    const valor = parseFloat(valorAtual);
    if (isNaN(valor) || valor <= 0) return;

    if (metodoAtual === 'fiado' && !selectedComanda.clientes?.telefone && !selectedComanda.clientes?.whatsapp) {
      alert('FIADO EXIGE TELEFONE DO CLIENTE.');
      return;
    }

    setPagamentos([...pagamentos, { metodo: metodoAtual, valor }]);
    setValorAtual('');
  };

  const handleRemovePagamento = (index: number) => {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  };

  const handleFinalizar = async () => {
    if (jaPago < totalComTaxa - 0.01) {
      alert(`FALTA RECEBER ${formatCurrency(faltaPagar)}`);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Salvar pagamentos
      await supabase.from('pagamentos_comanda').insert(
        pagamentos.map(p => ({ comanda_id: selectedComanda.id, metodo: p.metodo, valor: p.valor }))
      );

      // 2. Fechar comanda
      await supabase.from('comandas').update({ 
        status: 'paga',
        fechada_em: new Date().toISOString(),
        total_pago: totalComTaxa, // Salva o total esperado, o troco fica com o caixa
        taxa_servico_inclusa: useTaxa,
        valor_taxa_servico: useTaxa ? selectedComanda.total_calculado * 0.1 : 0
      }).eq('id', selectedComanda.id);

      // 3. Liberar mesa
      await supabase.from('mesas').update({ status: 'livre' }).eq('id', selectedComanda.mesa_id);

      alert('CONTA FINALIZADA!');
      setSelectedComanda(null);
      setPagamentos([]);
      fetchComandasAtivas();
    } catch (err: any) {
      alert('ERRO: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const shareWhatsApp = () => {
    if (!selectedComanda) return;
    const text = `*RESUMO DA CONTA - MESA ${selectedComanda.mesa.numero}*\n\n` +
      `Consumo: ${formatCurrency(selectedComanda.total_calculado)}\n` +
      `${useTaxa ? `Taxa 10%: ${formatCurrency(selectedComanda.total_calculado * 0.1)}\n` : ''}` +
      `*TOTAL: ${formatCurrency(totalComTaxa)}*\n\n` +
      `Obrigado!`;
    const phone = selectedComanda.clientes?.whatsapp || selectedComanda.clientes?.telefone || '';
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Painel do Caixa" />

      <main className="px-6 py-6 flex flex-col gap-6">
        {selectedComanda && (
          <div className="fixed inset-0 bg-stone-900/95 z-50 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase">Mesa {selectedComanda.mesa.numero}</h2>
              <button onClick={() => setSelectedComanda(null)}><XCircle size={32} className="opacity-40" /></button>
            </div>

            <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-xs font-bold text-stone-400 uppercase">Total Consumo</span>
                <span className="text-xl font-black">{formatCurrency(selectedComanda.total_calculado)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={useTaxa} onChange={(e) => setUseTaxa(e.target.checked)} className="accent-stone-900" />
                  <span className="text-[10px] font-bold uppercase">Taxa de Serviço (10%)</span>
                </label>
                <span className="text-2xl font-black text-stone-900">{formatCurrency(totalComTaxa)}</span>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t">
                <div className="flex gap-2">
                  <select value={metodoAtual} onChange={(e) => setMetodoAtual(e.target.value)} className="flex-1 bg-stone-50 border rounded-xl p-3 text-xs font-bold uppercase">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_debito">C. Débito</option>
                    <option value="cartao_credito">C. Crédito</option>
                    <option value="fiado">Fiado</option>
                  </select>
                  <input type="number" placeholder="Valor" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} className="w-24 bg-stone-50 border rounded-xl p-3 text-xs font-bold" />
                  <button onClick={handleAddPagamento} className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center"><Plus /></button>
                </div>

                <div className="flex flex-col gap-1">
                  {pagamentos.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg text-[10px] font-bold uppercase">
                      <span className="text-stone-400">{p.metodo}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-900">{formatCurrency(p.valor)}</span>
                        <button onClick={() => handleRemovePagamento(i)} className="text-red-500"><MinusCircle size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 bg-stone-900 text-white p-5 rounded-2xl mt-2">
                   <div className="flex justify-between items-center opacity-60">
                      <span className="text-[8px] uppercase font-bold tracking-widest">Já Recebido</span>
                      <span className="text-sm font-bold">{formatCurrency(jaPago)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold tracking-widest">Falta / Troco</span>
                        <span className="text-xl font-black">{troco > 0 ? `Troco: ${formatCurrency(troco)}` : formatCurrency(faltaPagar)}</span>
                      </div>
                      <Button onClick={handleFinalizar} disabled={(jaPago < totalComTaxa - 0.01) || isLoading} className="!bg-white !text-stone-900 h-12">
                        FINALIZAR
                      </Button>
                   </div>
                </div>
              </div>

              <button onClick={shareWhatsApp} className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase text-green-600 bg-green-50 rounded-xl">
                <Smartphone size={16} /> RESUMO NO WHATSAPP
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1">Atendimentos Ativos</h2>
          {comandas.map((c) => (
            <div key={c.id} className="bistro-card flex flex-col gap-4 border-stone-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-display font-black text-xl">{c.mesa.numero.toString().padStart(2, '0')}</div>
                  <div className="flex flex-col"><span className="text-sm font-bold text-stone-900 uppercase">{c.clientes?.nome || 'Mesa Local'}</span><span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{new Date(c.aberta_em).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                </div>
                <Badge variant={c.status === 'fechando' ? 'warning' : 'default'}>{c.status === 'fechando' ? 'SOLIC. FECHAMENTO' : 'ABERTA'}</Badge>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                <div className="flex flex-col"><span className="text-[8px] text-stone-400 uppercase font-bold tracking-widest">Consumo</span><span className="text-xl font-black text-stone-900">{formatCurrency(c.total_calculado)}</span></div>
                <button onClick={() => { if (c.total_calculado === 0) { if(confirm('FECHAR MESA ZERADA?')) { supabase.from('comandas').update({ status: 'paga', fechada_em: new Date().toISOString() }).eq('id', c.id); supabase.from('mesas').update({ status: 'livre' }).eq('id', c.mesa_id); } } else { setSelectedComanda(c); setPagamentos([]); } }} className="bg-stone-900 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all">FECHAR <ArrowRight size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
