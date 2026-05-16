import { User, LogOut, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title: string;
  showUser?: boolean;
  showBack?: boolean;
}

export const AppHeader = ({ title, showUser = true, showBack = false }: AppHeaderProps) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 w-full bg-bg-base/80 backdrop-blur-md border-b border-border px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack && (
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full text-text-secondary active:text-accent transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="text-xl font-display font-bold text-text-primary">{title}</h1>
      </div>
      
      {showUser && user && (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-text-primary">{user.nome}</span>
            <span className="text-[10px] uppercase tracking-wider text-text-secondary">{user.role}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 rounded-full bg-bg-elevated text-text-secondary hover:text-danger transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </header>
  );
};
