"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Utensils, Search, Receipt } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const tabs = [
    { id: 'mesas', label: 'Mesas', icon: Utensils, path: '/mesas' },
    { id: 'cardapio', label: 'Cardápio', icon: Search, path: '/cardapio' },
    ...(user.nivel_acesso === 'caixa' ? [
      { id: 'caixa', label: 'Caixa', icon: Receipt, path: '/caixa' }
    ] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-amber-50 border-t-2 border-amber-950 px-6 py-3 flex justify-around items-center safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.path);
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className={`flex flex-col items-center gap-1 transition-all active:scale-95
              ${isActive ? 'text-amber-950 scale-110' : 'text-amber-900/40'}`}
          >
            <div className={`p-1 ${isActive ? 'bg-amber-100 woodcut-border border-amber-950' : ''}`}>
              <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-display font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
