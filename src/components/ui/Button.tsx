import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}: ButtonProps) => {
  const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[var(--touch-min)]";
  
  const variants = {
    primary: 'woodcut-button',
    secondary: 'bg-amber-100 text-amber-950 border-2 border-amber-950 hover:bg-amber-200 active:translate-y-0.5 active:shadow-none shadow-[3px_3px_0px_0px_rgba(69,26,3,1)]',
    ghost: 'text-amber-950 hover:bg-amber-100 font-bold uppercase tracking-wider',
    danger: 'bg-red-900 text-white border-2 border-amber-950 shadow-[3px_3px_0px_0px_rgba(69,26,3,1)] active:translate-y-0.5 active:shadow-none'
  };

  return (
    <button
      className={`flex items-center justify-center gap-2 px-6 py-3 font-display text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
