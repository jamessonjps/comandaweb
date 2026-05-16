import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showUser?: boolean;
}

export function AppHeader({ 
  title = "Mangueirão", 
  showBack = false,
  showUser = true 
}: AppHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      logout();
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200 px-6 py-4">
      <div className="flex flex-col items-center gap-3">
        {/* Logotipo Centralizado e Limpo */}
        <div className="flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Mangueirão Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>

        <div className="w-full flex items-center justify-between mt-1">
          {showBack ? (
            <button onClick={() => router.back()} className="p-2 text-stone-400 active:text-stone-900 transition-colors">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button onClick={handleLogout} className="p-2 text-stone-400 active:text-red-600 transition-colors">
              <LogOut size={20} />
            </button>
          )}

          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">
            {title}
          </h2>

          <div className="w-10 flex justify-end">
            {showUser && (
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-xs border border-stone-200">
                {user?.nome?.[0] || 'M'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
