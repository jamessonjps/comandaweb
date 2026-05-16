"use client";

import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/formatters';
import { 
  Receipt, 
  Clock, 
  XCircle, 
  ArrowRight,
  Plus,
  Smartphone,
  MinusCircle,
  History,
  FileText,
  RotateCcw,
  Trash2,
  Lock,
  ListFilter,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth.store';

export default function CaixaDashboardPage() {
  const [comandasAtivas, setComandasAtivas] = useState<any[]>([]);
  const [comandasFechadas, setComandasFechadas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComanda, setSelectedComanda] = useState<any>(null);
  const [itensDaComanda, setItensDaComanda] = useState<any[]>([]);
  const [comandaDetalhes, setComandaDetalhes] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const user = useAuthStore(state => state.user);
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [useTaxa, setUseTaxa] = useState(true);
  const [pagamentos, setPagamentos] = useState<{metodo: string, valor: number}[]>([]);
  const [metodoAtual, setMetodoAtual] = useState('dinheiro');
  const [valorAtual, setValorAtual] = useState('');

  const fetchData = async () => {
    const { data: ativas } = await supabase
      .from('comandas')
      .select('*, mesa:mesas(numero), clientes(nome, telefone, whatsapp)')
      .in('status', ['aberta', 'fechando'])
      .order('aberta_em', { ascending: false });
    
    const hoje = new Date().toISOString().split('T')[0];
    const { data: fechadas } = await supabase
      .from('comandas')
      .select('*, mesa:mesas(numero), clientes(nome, telefone, whatsapp)')
      .eq('status', 'paga')
      .gte('fechada_em', `${hoje}T00:00:00Z`)
      .order('fechada_em', { ascending: false });

    setComandasAtivas(ativas || []);
    setComandasFechadas(fechadas || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('caixa-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comandas' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itens_pedido' }, () => {
         fetchData();
         if (selectedComanda) handleSelecionarComanda(selectedComanda, showReview);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedComanda]);

  const handleSelecionarComanda = async (comanda: any, reviewOnly = false) => {
    setSelectedComanda(comanda);
    setPagamentos([]);
    const { data } = await supabase.from('itens_pedido').select('*, produto:produtos(nome)').eq('comanda_id', comanda.id).neq('status_item', 'cancelado');
    setItensDaComanda(data || []);
    setShowReview(reviewOnly);
  };

  const handleAuthAction = (action: () => void) => {
    setPendingAction(() => action);
    setShowPinModal(true);
    setPinInput('');
  };

  const verifyPin = () => {
    if (pinInput === '5678') { 
      if (pendingAction) pendingAction();
      setShowPinModal(false);
      setPendingAction(null);
    } else {
      alert('PIN INVÁLIDO!');
      setPinInput('');
    }
  };

  const handleCancelarItem = async (itemId: string) => {
    handleAuthAction(async () => {
      await supabase.from('itens_pedido').update({ status_item: 'cancelado' }).eq('id', itemId);
      if (selectedComanda) handleSelecionarComanda(selectedComanda, showReview);
    });
  };

  const totalComTaxa = (selectedComanda?.total_calculado || 0) * (useTaxa ? 1.1 : 1);
  const jaPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const faltaPagar = Math.max(0, totalComTaxa - jaPago);
  const troco = Math.max(0, jaPago - totalComTaxa);

  const handleAddPagamento = () => {
    const valor = parseFloat(valorAtual);
    if (isNaN(valor) || valor <= 0) return;
    setPagamentos([...pagamentos, { metodo: metodoAtual, valor }]);
    setValorAtual('');
  };

  const handleFinalizar = async () => {
    if (jaPago < totalComTaxa - 0.01) { alert(`FALTA RECEBER ${formatCurrency(faltaPagar)}`); return; }
    setIsLoading(true);
    try {
      await supabase.from('pagamentos_comanda').insert(pagamentos.map(p => ({ comanda_id: selectedComanda.id, metodo: p.metodo, valor: p.valor })));
      await supabase.from('comandas').update({ status: 'paga', fechada_em: new Date().toISOString(), total_pago: totalComTaxa, taxa_servico_inclusa: useTaxa, valor_taxa_servico: useTaxa ? selectedComanda.total_calculado * 0.1 : 0 }).eq('id', selectedComanda.id);
      await supabase.from('mesas').update({ status: 'livre' }).eq('id', selectedComanda.mesa_id);
      alert('CONTA FINALIZADA!');
      setSelectedComanda(null);
      setItensDaComanda([]);
    } catch (err: any) { alert('ERRO: ' + err.message); } finally { setIsLoading(false); }
  };

  const handleReabrir = async (comanda: any) => {
    handleAuthAction(async () => {
      await supabase.from('comandas').update({ status: 'aberta', fechada_em: null }).eq('id', comanda.id);
      await supabase.from('mesas').update({ status: 'ocupada' }).eq('id', comanda.mesa_id);
      alert('CONTA REABERTA!');
      setComandaDetalhes(null);
      fetchData();
    });
  };

  const shareWhatsApp = async (comanda: any) => {
    const { data: itns } = await supabase.from('itens_pedido').select('*, produto:produtos(nome)').eq('comanda_id', comanda.id).neq('status_item', 'cancelado');
    const subtotal = comanda.total_calculado;
    const taxa = useTaxa ? subtotal * 0.1 : 0;
    const total = subtotal + taxa;

    let texto = `*🌊 MANGUEIRÃO BISTRO 🌊*\n`;
    texto += `*------------------------------*\n`;
    texto += `📝 *CONTA PARCIAL - MESA ${comanda.mesa?.numero || comanda.mesa_id}*\n`;
    texto += `👤 Cliente: ${comanda.clientes?.nome || 'Mesa Local'}\n`;
    texto += `*------------------------------*\n\n`;
    
    itns?.forEach((i: any) => {
      texto += `• ${i.quantidade}x ${i.produto.nome.padEnd(15)} ${formatCurrency(i.preco_unitario_congelado * i.quantidade)}\n`;
    });
    
    texto += `\n*------------------------------*\n`;
    texto += `Subtotal: ${formatCurrency(subtotal)}\n`;
    if (useTaxa) {
      texto += `Taxa de Serviço (10%): ${formatCurrency(taxa)}\n`;
      texto += `_(Opcional)_\n`;
    }
    texto += `*TOTAL: ${formatCurrency(total)}*\n`;
    texto += `*------------------------------*\n\n`;
    texto += `*Obrigado pela preferência!* 😊`;

    const phone = comanda.clientes?.whatsapp || comanda.clientes?.telefone || '';
    if (!phone) {
      alert('ESTA MESA NÃO TEM WHATSAPP CADASTRADO!');
      return;
    }
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Gestão do Caixa" />

      <main className="px-6 py-6 flex flex-col gap-8">
        
        {selectedComanda && (
          <div className="fixed inset-0 bg-stone-900/95 z-50 p-6 flex flex-col gap-4 overflow-y-auto">
             <div className="flex justify-between items-center text-white"><h2 className="text-xl font-black uppercase">{showReview ? 'Resumo da Mesa' : 'Fechar Mesa'} {selectedComanda.mesa.numero}</h2><button onClick={() => { setSelectedComanda(null); setShowReview(false); }}><XCircle size={32} className="opacity-40" /></button></div>
             <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
               
               <div className="flex flex-col gap-2 max-h-60 overflow-y-auto bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-2 mb-2"><ListFilter size={14} className="text-stone-400" /><span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">Itens Detalhados</span></div>
                  {itensDaComanda.length === 0 ? <span className="text-center py-6 text-[10px] font-bold text-stone-300 uppercase">Nenhum item</span> : itensDaComanda.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0 text-[10px] font-bold uppercase">
                       <span className="text-stone-600">{item.quantidade}x {item.produto.nome}</span>
                       <div className="flex items-center gap-3">
                          <span className="text-stone-900 font-black">{formatCurrency(item.preco_unitario_congelado * item.quantidade)}</span>
                          <button onClick={() => handleCancelarItem(item.id)} className="text-red-500 p-1"><Trash2 size={12} /></button>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="flex justify-between items-center pt-2"><span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Subtotal</span><span className="text-2xl font-black text-stone-900">{formatCurrency(selectedComanda.total_calculado)}</span></div>

               {!showReview ? (
                 <>
                   <div className="flex justify-between items-center py-2 border-t mt-2">
                     <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={useTaxa} onChange={(e) => setUseTaxa(e.target.checked)} className="accent-stone-900" /><span className="text-[10px] font-bold uppercase">Taxa 10% (Opcional)</span></label>
                     <span className="text-3xl font-black text-stone-900">{formatCurrency(totalComTaxa)}</span>
                   </div>
                   {/* ... (restante do fluxo de pagamento mantido) */}
                   <div className="flex gap-2">
                     <select value={metodoAtual} onChange={(e) => setMetodoAtual(e.target.value)} className="flex-1 bg-stone-50 border rounded-xl p-3 text-xs font-bold uppercase"><option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="cartao_debito">C. Débito</option><option value="cartao_credito">C. Crédito</option><option value="fiado">Fiado</option></select>
                     <input type="number" placeholder="Valor" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} className="w-24 bg-stone-50 border rounded-xl p-3 text-xs font-bold" />
                     <button onClick={handleAddPagamento} className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center shadow-md"><Plus /></button>
                   </div>
                   <div className="flex flex-col gap-1">
                     {pagamentos.map((p, i) => (<div key={i} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg text-[10px] font-bold uppercase"><span>{p.metodo}</span><div className="flex items-center gap-2"><span>{formatCurrency(p.valor)}</span><button onClick={() => setPagamentos(pagamentos.filter((_, idx) => idx !== i))} className="text-red-500"><MinusCircle size={14} /></button></div></div>))}
                   </div>
                   <div className="bg-stone-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-xl mt-2">
                     <div className="flex flex-col"><span className="text-[8px] uppercase font-bold opacity-60">{troco > 0 ? 'Troco' : 'Falta'}</span><span className="text-xl font-black">{troco > 0 ? formatCurrency(troco) : formatCurrency(faltaPagar)}</span></div>
                     <Button onClick={handleFinalizar} disabled={jaPago < totalComTaxa - 0.01} className="!bg-white !text-stone-900">FINALIZAR</Button>
                   </div>
                 </>
               ) : (
                 <button onClick={() => setShowReview(false)} className="w-full bg-stone-900 text-white p-5 rounded-2xl font-bold uppercase tracking-widest mt-2 shadow-xl">RECEBER AGORA</button>
               )}
               <button onClick={() => shareWhatsApp(selectedComanda)} className="w-full py-4 text-[10px] font-black uppercase text-green-600 bg-green-50 rounded-xl flex items-center justify-center gap-2"><MessageCircle size={16} /> ENVIAR PARA O WHATSAPP DO CLIENTE</button>
             </div>
          </div>
        )}

        {/* ... (restante dos modais e listagens mantidos) */}
        {showPinModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-900"><Lock size={20} /></div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-sm font-black uppercase tracking-widest">Autorização</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">Digite o PIN do Gerente</p>
                </div>
                <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full bg-stone-50 border rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-stone-900" autoFocus />
                <div className="grid grid-cols-2 gap-3 w-full">
                   <button onClick={() => { setShowPinModal(false); setPendingAction(null); }} className="py-3 text-[10px] font-bold uppercase text-stone-400 bg-stone-50 rounded-xl">Sair</button>
                   <button onClick={verifyPin} className="py-3 text-[10px] font-bold uppercase text-white bg-stone-900 rounded-xl">Confirmar</button>
                </div>
             </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1"><Receipt size={16} className="text-stone-400" /><h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Comandas Ativas</h2></div>
          {comandasAtivas.map(c => (
            <div key={c.id} onClick={() => handleSelecionarComanda(c, true)} className="bistro-card flex flex-col gap-4 border-stone-200 active:scale-[0.98] transition-all cursor-pointer">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-display font-black text-xl">{c.mesa.numero.toString().padStart(2, '0')}</div>
                    <div className="flex flex-col"><span className="text-sm font-bold text-stone-900 uppercase">{c.clientes?.nome || 'Mesa Local'}</span><span className="text-[9px] text-stone-400 font-bold uppercase">{new Date(c.aberta_em).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                  </div>
                  <Badge variant={c.status === 'fechando' ? 'warning' : 'default'}>{c.status === 'fechando' ? 'SOLIC. FECHAMENTO' : 'ABERTA'}</Badge>
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="flex flex-col"><span className="text-[8px] text-stone-400 uppercase font-bold tracking-widest">Valor Atual</span><span className="text-xl font-black text-stone-900">{formatCurrency(c.total_calculado)}</span></div>
                  <button onClick={(e) => { e.stopPropagation(); handleSelecionarComanda(c, false); }} className="bg-stone-900 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-stone-800">FECHAR CONTA</button>
               </div>
            </div>
          ))}
        </div>
        {/* ... (Histórico mantido) */}
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2 px-1"><History size={16} className="text-stone-400" /><h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Histórico de Hoje</h2></div>
          <div className="flex flex-col gap-2">
            {comandasFechadas.map(c => (
              <div key={c.id} onClick={() => setComandaDetalhes(c)} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xs">{c.mesa.numero}</div>
                   <div className="flex flex-col"><span className="text-xs font-bold uppercase">{c.clientes?.nome || 'Mesa Local'}</span><span className="text-[8px] font-bold text-stone-400 uppercase">FECHADA ÀS {new Date(c.fechada_em).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                </div>
                <div className="flex flex-col items-end"><span className="text-xs font-black text-stone-900">{formatCurrency(c.total_pago)}</span><span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">PAGA</span></div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
