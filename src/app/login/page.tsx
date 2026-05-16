"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Delete, Lock, Loader2, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  // Garantir que o erro suma ao digitar
  useEffect(() => {
    if (pin.length > 0) setError('');
  }, [pin]);

  const handleKeyPress = (val: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN MUITO CURTO');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Teste de conexão antes de buscar
      const { data, error: dbError } = await supabase
        .from('perfis')
        .select('id, nome, nivel_acesso')
        .eq('pin_hash', pin)
        .eq('ativo', true)
        .maybeSingle();

      if (dbError) {
        setError('ERRO DE CONEXÃO COM O BANCO');
        console.error(dbError);
        return;
      }

      if (!data) {
        setError('PIN INCORRETO OU INATIVO');
        setPin('');
      } else {
        login({ 
          id: data.id, 
          nome: data.nome, 
          nivel_acesso: data.nivel_acesso 
        });
        
        // Pequeno delay para garantir que o estado foi salvo
        setTimeout(() => {
          router.replace('/mesas');
        }, 100);
      }
    } catch (err) {
      setError('ERROinesperado. TENTE NOVAMENTE.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 select-none touch-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-28 w-auto object-contain" />
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Sistema de Comandas</h1>
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex gap-4 h-4 items-center">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-full border-2 border-stone-200 transition-all duration-200
                  ${i < pin.length ? 'bg-stone-900 border-stone-900 scale-125' : 'bg-transparent'}`}
              />
            ))}
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl animate-bounce">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 bg-white border border-stone-100 rounded-2xl text-xl font-black text-stone-900 active:bg-stone-900 active:text-white shadow-sm"
            >
              {num}
            </button>
          ))}
          <button onClick={handleDelete} className="h-16 flex items-center justify-center text-stone-300 active:text-stone-900"><Delete size={24} /></button>
          <button onClick={() => handleKeyPress('0')} className="h-16 bg-white border border-stone-100 rounded-2xl text-xl font-black text-stone-900 active:bg-stone-900 active:text-white shadow-sm">0</button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || pin.length < 4}
            className="h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center disabled:opacity-20 shadow-lg"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Lock size={24} />}
          </button>
        </div>
        
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 text-[8px] text-stone-300 uppercase font-bold tracking-widest mt-4 hover:text-stone-900 transition-colors"
        >
          <RefreshCcw size={10} /> Limpar e Reiniciar Sistema
        </button>
      </div>
    </div>
  );
}
