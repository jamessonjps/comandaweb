"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminPagamentosPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [methods, setMethods] = useState({
    dinheiro: true,
    pix: true,
    cartao_credito: true,
    cartao_debito: true,
    fiado: false
  });

  if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
    router.push('/mesas');
    return null;
  }

  const fetchMethods = async () => {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('id', 'pagamentos')
      .single();

    if (!error && data) {
      setMethods(data.valor);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleToggle = (key: string) => {
    setMethods(prev => ({ ...prev, [key]: !prev[key as keyof typeof methods] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ id: 'pagamentos', valor: methods, atualizado_em: new Date().toISOString() });

    if (!error) {
      setMessage('MÉTODOS DE PAGAMENTO ATUALIZADOS!');
      setTimeout(() => setMessage(''), 3000);
    }
    setIsSaving(false);
  };

  const paymentOptions = [
    { id: 'dinheiro', label: 'Dinheiro espécie', icon: Banknote, color: 'bg-green-50 text-green-600' },
    { id: 'pix', label: 'PIX (Transferência)', icon: Smartphone, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
    { id: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard, color: 'bg-stone-50 text-stone-600' },
    { id: 'fiado', label: 'Fiado (Conta Cliente)', icon: Banknote, color: 'bg-red-50 text-red-600' }
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Pagamentos" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Métodos Ativos</h1>
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Selecione o que o caixa pode receber</p>
        </div>

        <div className="flex flex-col gap-3">
          {paymentOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleToggle(opt.id)}
              className={`bistro-card flex items-center justify-between p-5 transition-all ${methods[opt.id as keyof typeof methods] ? 'border-stone-900 ring-1 ring-stone-900' : 'opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center`}>
                  <opt.icon size={20} />
                </div>
                <span className="text-xs font-bold text-stone-900 uppercase tracking-tight">{opt.label}</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${methods[opt.id as keyof typeof methods] ? 'bg-stone-900 border-stone-900' : 'border-stone-200'}`}>
                {methods[opt.id as keyof typeof methods] && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <Button onClick={handleSave} isLoading={isSaving} className="w-full shadow-xl">
            <Save size={20} />
            SALVAR CONFIGURAÇÕES
          </Button>
          {message && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
