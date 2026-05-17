"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { 
  Users, 
  ShoppingBag, 
  Clock, 
  CreditCard, 
  UserPlus, 
  BarChart3, 
  ChevronRight,
  BookUser,
  History
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Proteção de rota
  if (!user || (user.nivel_acesso !== 'admin' && user.nivel_acesso !== 'GERENTE')) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-black text-stone-900 mb-2 uppercase">Acesso Restrito</h1>
        <p className="text-stone-400 text-sm mb-6">Você não tem permissão para acessar esta área.</p>
        <button onClick={() => router.push('/mesas')} className="text-stone-900 font-bold uppercase tracking-widest text-xs underline">Voltar para Mesas</button>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Gestão Financeira",
      description: "Dashboard de vendas e faturamento",
      icon: BarChart3,
      path: "/admin/dashboard",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Histórico de Vendas",
      description: "Histórico de comandas e atendimentos",
      icon: History,
      path: "/admin/historico",
      color: "bg-stone-200 text-stone-700"
    },
    {
      title: "Funcionários",
      description: "Cadastro e permissões de acesso",
      icon: Users,
      path: "/admin/usuarios",
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Cardápio e Estoque",
      description: "Atualizar produtos e inventário",
      icon: ShoppingBag,
      path: "/admin/cardapio",
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Clientes e Fiado",
      description: "Base de dados e controle de débitos",
      icon: BookUser,
      path: "/admin/clientes",
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "Pagamentos",
      description: "Configurar PIX, Cartão e Dinheiro",
      icon: CreditCard,
      path: "/admin/pagamentos",
      color: "bg-red-50 text-red-600"
    },
    {
      title: "Horários",
      description: "Funcionamento do estabelecimento",
      icon: Clock,
      path: "/admin/horarios",
      color: "bg-stone-50 text-stone-600"
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans">
      <AppHeader title="Administração" showBack={false} />

      <main className="px-6 py-6 flex flex-col gap-8">
        {/* Header de Boas Vindas */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-stone-900 tracking-tighter">
            Olá, {user.nome.split(' ')[0]}
          </h1>
          <p className="text-stone-400 text-xs font-medium">Painel de controle do estabelecimento</p>
        </div>

        {/* Grid de Funções */}
        <div className="grid grid-cols-1 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="bistro-card flex items-center justify-between p-4 active:scale-[0.98] transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                  <item.icon size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-stone-900 uppercase tracking-tight">{item.title}</span>
                  <span className="text-[10px] text-stone-400 font-medium">{item.description}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-stone-300" />
            </button>
          ))}
        </div>

        {/* Card de Informação Rápida */}
        <div className="bg-stone-900 rounded-3xl p-6 text-white flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Status do Sistema</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            Todas as funções operacionais estão ativas. O backup automático do banco de dados foi realizado hoje às 04:00.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
