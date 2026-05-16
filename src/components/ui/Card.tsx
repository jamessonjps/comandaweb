import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card = ({ children, className = '', onClick, hoverable = true }: CardProps) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-bg-surface border border-border rounded-2xl p-4 shadow-card
        ${hoverable ? 'transition-all hover:bg-bg-elevated hover:border-accent/30 cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
