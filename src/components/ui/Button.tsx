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
    primary: "bg-accent text-black hover:opacity-90 shadow-[0_0_20px_rgba(234,179,8,0.2)]",
    secondary: "bg-bg-elevated text-text-primary hover:bg-bg-overlay border border-border",
    danger: "bg-danger text-white hover:opacity-90 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-overlay"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
