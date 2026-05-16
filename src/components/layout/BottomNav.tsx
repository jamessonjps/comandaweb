"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Utensils, Search, Receipt, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const tabs = [
    { id: 'mesas', label: 'Mesas', icon: Utensils, path: '/mesas' },
    { id: 'cardapio', label: 'Cardápio', icon: Search, path: '/cardapio' },
    ...(user.nivel_acesso === 'caixa' || user.nivel_acesso === 'admin' || user.nivel_acesso === 'GERENTE' ? [
      { id: 'caixa', label: 'Caixa', icon: Receipt, path: '/caixa' }
    ] : []),
    ...(user.nivel_acesso === 'admin' || user.nivel_acesso === 'GERENTE' ? [
      { id: 'admin', label: 'Admin', icon: Settings, path: '/admin' }
    ] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-6 py-3 flex justify-around items-center safe-area-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.path);
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className={`flex flex-col items-center gap-1 transition-all
              ${isActive ? 'text-stone-900 scale-105' : 'text-stone-400'}`}
          >
            <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-stone-100' : ''}`}>
              <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
