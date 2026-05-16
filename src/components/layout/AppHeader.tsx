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

          <div className="w-14 flex justify-end items-center gap-2">
            {showUser && user && (
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-stone-900 uppercase leading-none">{user.nome.split(' ')[0]}</span>
                <span className="text-[7px] font-bold text-stone-400 uppercase tracking-tighter mt-0.5">
                  {user.nivel_acesso === 'admin' ? 'GERENTE' : user.nivel_acesso}
                </span>
              </div>
            )}
            {showUser && (
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-[11px] font-black border border-stone-800 shadow-sm shrink-0">
                {user?.nome?.[0] || '?'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
