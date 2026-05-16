import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showUser?: boolean;
}

export const AppHeader = ({ title, showBack = false, showUser = true }: AppHeaderProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 w-full bg-amber-50 border-b-2 border-amber-950 px-6 py-4">
      <div className="flex flex-col items-center gap-2">
        {/* Logotipo Centralizado */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-amber-950 flex items-center justify-center font-display font-black text-xl mb-1">
            M
          </div>
          <h1 className="font-display text-lg font-black tracking-tighter text-amber-950 leading-none">
            MANGUEIRÃO
          </h1>
          <span className="text-[8px] font-display font-bold tracking-[0.2em] text-amber-900">
            BAR & PETISCARIA
          </span>
        </div>

        <div className="w-full flex items-center justify-between mt-2">
          <div className="w-10">
            {showBack && (
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-amber-100 text-amber-950 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
          
          <h2 className="text-sm font-display font-bold uppercase tracking-widest text-amber-800">
            {title}
          </h2>

          <div className="w-10 text-right">
            {showUser && user && (
              <div className="w-8 h-8 ml-auto bg-amber-950 text-amber-50 rounded-full flex items-center justify-center text-xs font-bold">
                {user.nome.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
