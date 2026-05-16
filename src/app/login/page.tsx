"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Delete, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

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
      if (pin === '1234') {
        login({ id: '1', nome: 'Garçom Teste', nivel_acesso: 'garcom' });
        router.push('/mesas');
      } else if (pin === '5678') {
        login({ id: '2', nome: 'Caixa Teste', nivel_acesso: 'caixa' });
        router.push('/mesas');
      } else {
        setError('PIN INCORRETO');
        setPin('');
      }
    } catch (err) {
      setError('ERRO NO LOGIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 select-none font-serif">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        
        {/* Logo Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 border-4 border-amber-950 rounded-full flex items-center justify-center bg-amber-100 shadow-[6px_6px_0px_0px_#451A03]">
             <UtensilsIcon size={40} className="text-amber-950" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-display font-black text-amber-950 tracking-tighter leading-none">MANGUEIRÃO</h1>
            <p className="text-[10px] font-display font-bold tracking-[0.3em] text-amber-900 mt-1 uppercase">Bar & Petiscaria</p>
          </div>
        </div>

        {/* PIN Display */}
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex gap-4 h-12 items-center">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 border-amber-950 transition-all 
                  ${i < pin.length ? 'bg-amber-950' : 'bg-transparent'}`}
              />
            ))}
          </div>
          {error && <span className="text-red-900 text-xs font-black uppercase tracking-widest">{error}</span>}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="h-20 bg-amber-100 border-2 border-amber-950 text-3xl font-display font-black text-amber-950 active:bg-amber-950 active:text-amber-50 transition-all shadow-[4px_4px_0px_0px_#451A03] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none touch-manipulation"
            >
              {num}
            </button>
          ))}
          <button 
            type="button"
            onClick={handleDelete}
            className="h-20 flex items-center justify-center text-amber-950 active:text-red-900"
          >
            <Delete size={32} />
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-20 bg-amber-100 border-2 border-amber-950 text-3xl font-display font-black text-amber-950 active:bg-amber-950 active:text-amber-50 transition-all shadow-[4px_4px_0px_0px_#451A03] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none touch-manipulation"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || pin.length < 4}
            className="h-20 bg-amber-950 text-amber-50 flex items-center justify-center shadow-[4px_4px_0px_0px_#78350F] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" size={32} /> : <Lock size={32} />}
          </button>
        </div>
        
        <p className="text-[10px] text-amber-900/50 uppercase font-bold tracking-widest">Acesso Restrito a Colaboradores</p>
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
