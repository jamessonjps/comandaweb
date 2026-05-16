"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated) {
      if (isAuthenticated) {
        router.replace('/mesas');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, _hasHydrated, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="w-16 h-16 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
      
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[#F4F4F5]">Comanda Web</h2>
        <p className="text-[#A1A1AA] text-sm">Iniciando sistema...</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-10">
        <button 
          onClick={() => router.push('/login')}
          className="w-full bg-[#161618] border border-[#27272A] text-[#F4F4F5] py-4 rounded-xl text-sm font-bold active:bg-[#27272A]"
        >
          Entrar Manualmente
        </button>
        <p className="text-[10px] text-[#52525B] italic">
          Se a tela não carregar sozinha em 5 segundos, clique acima.
        </p>
      </div>
    </div>
  );
}
