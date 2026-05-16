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
      className={`woodcut-card ${hoverable ? 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
