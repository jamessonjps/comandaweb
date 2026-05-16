import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variants = {
    default: 'bg-amber-100 text-amber-950 border border-amber-950',
    success: 'bg-green-100 text-green-900 border border-green-900',
    warning: 'bg-yellow-100 text-yellow-900 border border-yellow-900',
    danger: 'bg-red-100 text-red-900 border border-red-900',
    info: 'bg-amber-950 text-amber-50 border border-amber-950'
  };

  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-display font-black uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
