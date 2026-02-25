import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand text-white hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
}
