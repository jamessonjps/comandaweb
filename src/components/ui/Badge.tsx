import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const variants = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20 animate-pulse",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-info/10 text-info border-info/20",
    default: "bg-bg-elevated text-text-secondary border-border"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  );
};
