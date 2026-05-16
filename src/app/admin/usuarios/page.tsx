"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  UserCircle,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Perfil {
  id: string;
  nome: string;
  nivel_acesso: 'garcom' | 'caixa' | 'admin';
  ativo: boolean;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Proteção de rota
  if (!user || user.nivel_acesso !== 'admin') {
    router.push('/mesas');
    return null;
  }

  const fetchPerfis = async () => {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .order('nome', { ascending: true });

    if (!error) setPerfis(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPerfis();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('perfis')
      .update({ ativo: !currentStatus })
      .eq('id', id);
    
    if (!error) fetchPerfis();
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Funcionários" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {/* Ação de Novo Usuário */}
        <button className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest active:scale-[0.98] transition-all">
          <UserPlus size={20} />
          CADASTRAR NOVO FUNCIONÁRIO
        </button>

        {/* Lista de Funcionários */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1">
            Equipe Ativa
          </h2>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            perfis.map((perfil) => (
              <div key={perfil.id} className={`bistro-card flex items-center justify-between gap-4 ${!perfil.ativo ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${perfil.nivel_acesso === 'admin' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {perfil.nivel_acesso === 'admin' ? <ShieldCheck size={24} /> : <UserCircle size={24} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900 uppercase">{perfil.nome}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={perfil.nivel_acesso === 'admin' ? 'info' : 'secondary'}>
                        {perfil.nivel_acesso}
                      </Badge>
                      {!perfil.ativo && (
                        <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">Inativo</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleStatus(perfil.id, perfil.ativo)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${perfil.ativo ? 'text-red-400 bg-red-50' : 'text-green-600 bg-green-50'}`}
                  >
                    {perfil.ativo ? <Trash2 size={18} /> : <UserPlus size={18} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Aviso de Segurança */}
        <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <AlertTriangle className="text-amber-600 shrink-0" size={20} />
          <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
            Alterar permissões de acesso pode desconectar o usuário imediatamente. Tenha cautela ao remover administradores.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
