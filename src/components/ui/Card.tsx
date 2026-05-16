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
      className={`bistro-card ${hoverable ? 'bistro-card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
