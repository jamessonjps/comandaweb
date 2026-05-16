"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Delete, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleKeyPress = (val: string) => {
    setError('');
    if (pin.length < 6) {
      setPin(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN MUITO CURTO');
      return;
    }

    setIsLoading(true);
    try {
      // Busca real no banco de dados pelo PIN
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('pin_hash', pin) // No MVP usamos o PIN direto, em prod usaríamos hash
        .eq('ativo', true)
        .single();

      if (error || !data) {
        setError('PIN INCORRETO OU INATIVO');
        setPin('');
      } else {
        login({ 
          id: data.id, 
          nome: data.nome, 
          nivel_acesso: data.nivel_acesso 
        });
        router.push('/mesas');
      }
    } catch (err) {
      setError('ERRO NO SERVIDOR');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 select-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-12">
        
        {/* Logo Branding - Cleaner */}
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Mangueirão Logo" 
            className="h-32 w-auto object-contain"
          />
        </div>

        {/* PIN Display - Cleaner */}
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex gap-4 h-4 items-center">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-full border-2 border-stone-200 transition-all duration-300
                  ${i < pin.length ? 'bg-stone-900 border-stone-900 scale-125' : 'bg-transparent'}`}
              />
            ))}
          </div>
          {error && <span className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">{error}</span>}
        </div>

        {/* Keypad - High Contrast */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="h-20 bg-white border border-stone-200 rounded-2xl text-2xl font-bold text-stone-900 active:bg-stone-900 active:text-white transition-all shadow-sm active:scale-95 touch-manipulation"
            >
              {num}
            </button>
          ))}
          <button 
            type="button"
            onClick={handleDelete}
            className="h-20 flex items-center justify-center text-stone-400 active:text-stone-900 transition-colors"
          >
            <Delete size={28} />
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-20 bg-white border border-stone-200 rounded-2xl text-2xl font-bold text-stone-900 active:bg-stone-900 active:text-white transition-all shadow-sm active:scale-95 touch-manipulation"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || pin.length < 4}
            className="h-20 bg-stone-900 text-white rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-20 transition-all shadow-md"
          >
            {isLoading ? <Loader2 className="animate-spin" size={28} /> : <Lock size={28} />}
          </button>
        </div>
        
        <p className="text-[9px] text-stone-400 uppercase font-bold tracking-[0.2em]">Acesso Restrito</p>
      </div>
    </div>
  );
}

function UtensilsIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}
