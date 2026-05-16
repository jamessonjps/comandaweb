"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, UtensilsCrossed, Receipt, User } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Mesas', href: '/mesas', icon: LayoutGrid },
    { label: 'Cardápio', href: '/cardapio', icon: UtensilsCrossed },
    { label: 'Caixa', href: '/caixa', icon: Receipt, role: 'caixa' },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/90 backdrop-blur-lg border-t border-border px-4 pb-safe-offset-2 pt-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-xl transition-all
                ${active ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}
              `}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">
                {item.label}
              </span>
              {active && (
                <div className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
