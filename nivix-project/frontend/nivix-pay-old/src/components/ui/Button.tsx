import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'teal' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'font-display font-semibold rounded-md transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'bg-transparent border-2 hover:text-white',
    teal: 'btn-teal',
    ghost: 'bg-transparent hover:bg-ink-50',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {},
    secondary: {},
    outline: {
      color: 'var(--color-navy-600)',
      borderColor: 'var(--color-navy-600)',
    },
    teal: {},
    ghost: {
      color: 'var(--color-ink-600)',
    },
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '32px' },
    md: { height: '40px' },
    lg: { height: '48px' },
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{ ...variantStyles[variant], ...sizeStyles[size] }}
      {...props}
    >
      {children}
    </button>
  );
};
