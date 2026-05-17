"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  MapPin, 
  Store, 
  Save, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminHorariosPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [config, setConfig] = useState({
    nome_fantasia: 'Mangueirão Bar & Petiscaria',
    resumo: 'O melhor ponto de encontro para petiscos artesanais e cerveja gelada.',
    endereco: 'Rua Principal, 123 - Centro',
    telefone: '(11) 99999-9999',
    horarios: {
      seg: "18:00-00:00",
      ter: "18:00-00:00",
      qua: "18:00-00:00",
      qui: "18:00-00:00",
      sex: "18:00-02:00",
      sab: "11:00-02:00",
      dom: "11:00-22:00"
    }
  });

  if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
    router.push('/mesas');
    return null;
  }

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('id', 'estabelecimento')
      .single();

    if (!error && data) {
      setConfig(data.valor);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ id: 'estabelecimento', valor: config, atualizado_em: new Promise(r => r(new Date().toISOString())) });

    if (!error) {
      setMessage('CONFIGURAÇÕES SALVAS!');
      setTimeout(() => setMessage(''), 3000);
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Configurações" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Seção: Sobre o Estabelecimento */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
            <Store size={14} /> Identidade
          </h2>
          <div className="bistro-card flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Nome Fantasia</label>
              <input 
                type="text" 
                value={config.nome_fantasia}
                onChange={(e) => setConfig({...config, nome_fantasia: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm font-bold text-stone-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Resumo / Slogan</label>
              <textarea 
                rows={2}
                value={config.resumo}
                onChange={(e) => setConfig({...config, resumo: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm text-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Seção: Localização */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
            <MapPin size={14} /> Localização e Contato
          </h2>
          <div className="bistro-card flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Endereço Completo</label>
              <input 
                type="text" 
                value={config.endereco}
                onChange={(e) => setConfig({...config, endereco: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm text-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Seção: Horários */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
            <Clock size={14} /> Horários de Funcionamento
          </h2>
          <div className="bistro-card grid grid-cols-1 gap-3">
            {Object.entries(config.horarios).map(([dia, hora]) => (
              <div key={dia} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <span className="text-xs font-bold text-stone-900 uppercase">{dia}</span>
                <input 
                  type="text" 
                  value={hora}
                  onChange={(e) => setConfig({
                    ...config, 
                    horarios: {...config.horarios, [dia]: e.target.value}
                  })}
                  className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-1 text-xs text-stone-900 w-32 text-center font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Botão Salvar Fixo ou no fim */}
        <div className="flex flex-col gap-4 mt-4">
          <Button 
            onClick={handleSave} 
            isLoading={isSaving}
            className="w-full shadow-xl"
          >
            <Save size={20} />
            SALVAR ALTERAÇÕES
          </Button>
          {message && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest animate-bounce">
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
