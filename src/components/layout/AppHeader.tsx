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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200 px-6 py-4">
      <div className="flex flex-col items-center gap-3">
        {/* Logotipo Centralizado e Limpo */}
        <div className="flex flex-col items-center text-center">
          <h1 className="font-display text-xl font-extrabold tracking-tighter text-stone-900 leading-none">
            MANGUEIRÃO
          </h1>
          <span className="text-[9px] font-bold tracking-[0.25em] text-stone-400 mt-1 uppercase">
            Bar & Petiscaria
          </span>
        </div>

        <div className="w-full flex items-center justify-between mt-1">
          <div className="w-10">
            {showBack && (
              <button 
                onClick={() => router.back()}
                className="p-2 -ml-2 hover:bg-stone-50 text-stone-900 transition-colors rounded-full"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
          
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">
            {title}
          </h2>

          <div className="w-10 text-right">
            {showUser && user && (
              <div className="w-8 h-8 ml-auto bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                {user.nome.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
