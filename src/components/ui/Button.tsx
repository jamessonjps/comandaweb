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
  const variants = {
    primary: 'bistro-button-primary',
    secondary: 'bistro-button-secondary',
    ghost: 'text-stone-600 hover:bg-stone-100 font-bold uppercase tracking-wider',
    danger: 'bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest'
  };

  return (
    <button
      className={`min-h-[48px] px-6 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      ...props
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
