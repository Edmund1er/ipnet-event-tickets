import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition duration-200 focus:outline-none';
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    secondary: 'bg-slate-700 hover:bg-slate-800 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className} ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Chargement...' : children}
    </button>
  );
};
