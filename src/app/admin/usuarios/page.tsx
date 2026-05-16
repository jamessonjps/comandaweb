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
  ShieldCheck, 
  UserCircle,
  Edit2,
  XCircle,
  Save
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Perfil {
  id: string;
  nome: string;
  nivel_acesso: 'garcom' | 'caixa' | 'admin' | 'GERENTE';
  ativo: boolean;
  pin_hash: string;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Partial<Perfil>>({});

  useEffect(() => {
    if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
      router.push('/mesas');
    }
  }, [user]);

  const fetchPerfis = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('perfis').select('*').order('nome', { ascending: true });
    if (!error) setPerfis(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchPerfis(); }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('perfis').update({ ativo: !currentStatus }).eq('id', id);
    fetchPerfis();
  };

  const handleEdit = (perfil: Perfil) => {
    setEditingPerfil(perfil);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPerfil.nome || !editingPerfil.pin_hash) {
      alert('PREENCHA NOME E PIN!');
      return;
    }
    setIsLoading(true);
    if (editingPerfil.id) {
      // Update
      await supabase.from('perfis').update({ nome: editingPerfil.nome, nivel_acesso: editingPerfil.nivel_acesso, pin_hash: editingPerfil.pin_hash }).eq('id', editingPerfil.id);
    } else {
      // Create
      await supabase.from('perfis').insert({ nome: editingPerfil.nome, nivel_acesso: editingPerfil.nivel_acesso || 'garcom', pin_hash: editingPerfil.pin_hash, ativo: true });
    }
    setIsEditing(false);
    setEditingPerfil({});
    fetchPerfis();
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Funcionários" showBack={true} />

      <main className="px-6 py-6 flex flex-col gap-6">
        {isEditing && (
          <div className="bistro-card bg-stone-900 text-white flex flex-col gap-4 mb-8 border-none shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">{editingPerfil.id ? 'Editando' : 'Novo'} Funcionário</h3>
              <button onClick={() => setIsEditing(false)}><XCircle size={20} className="opacity-40" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Nome Completo" value={editingPerfil.nome || ''} onChange={(e) => setEditingPerfil({...editingPerfil, nome: e.target.value})} className="bg-stone-800 border-none rounded-xl p-3 text-sm focus:ring-1 ring-stone-700 outline-none" />
              <input type="text" placeholder="PIN (6 dígitos)" maxLength={6} value={editingPerfil.pin_hash || ''} onChange={(e) => setEditingPerfil({...editingPerfil, pin_hash: e.target.value})} className="bg-stone-800 border-none rounded-xl p-3 text-sm focus:ring-1 ring-stone-700 outline-none font-mono tracking-widest" />
              <select value={editingPerfil.nivel_acesso} onChange={(e) => setEditingPerfil({...editingPerfil, nivel_acesso: e.target.value as any})} className="bg-stone-800 border-none rounded-xl p-3 text-sm focus:ring-1 ring-stone-700 outline-none uppercase font-bold">
                <option value="garcom">GARÇOM</option>
                <option value="caixa">CAIXA</option>
                <option value="GERENTE">GERENTE</option>
                <option value="admin">ADMIN (TI)</option>
              </select>
            </div>
            <button onClick={handleSaveEdit} className="w-full bg-white text-stone-900 p-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] mt-2 flex items-center justify-center gap-2">
              <Save size={16} /> SALVAR ALTERAÇÕES
            </button>
          </div>
        )}

        {!isEditing && (
          <button onClick={() => { setEditingPerfil({ nivel_acesso: 'garcom' }); setIsEditing(true); }} className="w-full bg-stone-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest active:scale-[0.98] transition-all">
            <UserPlus size={20} /> CADASTRAR NOVO
          </button>
        )}

        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] px-1">Equipe do Mangueirão</h2>
          {perfis.map((perfil) => (
            <div key={perfil.id} className={`bistro-card flex items-center justify-between gap-4 ${!perfil.ativo ? 'opacity-40 grayscale' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(perfil.nivel_acesso === 'admin' || perfil.nivel_acesso === 'GERENTE') ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                  {(perfil.nivel_acesso === 'admin' || perfil.nivel_acesso === 'GERENTE') ? <ShieldCheck size={24} /> : <UserCircle size={24} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-stone-900 uppercase">{perfil.nome}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={(perfil.nivel_acesso === 'admin' || perfil.nivel_acesso === 'GERENTE') ? 'info' : 'default'}>
                      {perfil.nivel_acesso}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(perfil)} className="w-10 h-10 rounded-xl bg-stone-50 text-stone-900 flex items-center justify-center active:scale-90"><Edit2 size={18} /></button>
                <button onClick={() => handleToggleStatus(perfil.id, perfil.ativo)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${perfil.ativo ? 'text-red-400 bg-red-50' : 'text-green-600 bg-green-50'}`}>{perfil.ativo ? <Trash2 size={18} /> : <UserPlus size={18} />}</button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
