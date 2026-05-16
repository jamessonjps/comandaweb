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
      setError('PIN muito curto');
      return;
    }

    setIsLoading(true);
    try {
      if (pin === '1234') {
        login({ id: '1', nome: 'Garçom Teste', role: 'garcom' });
        router.push('/mesas');
      } else if (pin === '5678') {
        login({ id: '2', nome: 'Caixa Teste', role: 'caixa' });
        router.push('/mesas');
      } else {
        setError('PIN incorreto');
        setPin('');
      }
    } catch (err) {
      setError('Erro no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center px-6 select-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-[#EAB308] rounded-2xl flex items-center justify-center shadow-lg">
            <UtensilsIcon className="text-black" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#F4F4F5] mt-4">Comanda Web</h1>
          <p className="text-[#A1A1AA] text-sm">Insira seu PIN</p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex gap-4 h-12 items-center">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all 
                  ${i < pin.length ? 'bg-[#EAB308] border-[#EAB308]' : 'border-[#27272A]'}`}
              />
            ))}
          </div>
          {error && <span className="text-[#EF4444] text-xs font-bold">{error}</span>}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="h-20 bg-[#161618] border border-[#27272A] rounded-2xl text-2xl font-bold text-[#F4F4F5] active:bg-[#EAB308] active:text-black touch-manipulation"
            >
              {num}
            </button>
          ))}
          <button 
            type="button"
            onClick={handleDelete}
            className="h-20 flex items-center justify-center text-[#A1A1AA] active:text-[#EF4444]"
          >
            <Delete size={28} />
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-20 bg-[#161618] border border-[#27272A] rounded-2xl text-2xl font-bold text-[#F4F4F5] active:bg-[#EAB308] active:text-black touch-manipulation"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || pin.length < 4}
            className="h-20 bg-[#EAB308] rounded-2xl flex items-center justify-center text-black disabled:opacity-30 transition-all shadow-lg"
          >
            {isLoading ? <Loader2 className="animate-spin" size={28} /> : <Lock size={28} />}
          </button>
        </div>
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
