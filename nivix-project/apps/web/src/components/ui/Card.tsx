import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: 'default' | 'blockchain' | 'elevated';
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  style,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 1px 3px rgba(10, 14, 20, 0.05), 0 10px 30px rgba(10, 14, 20, 0.03)',
    },
    blockchain: {
      backgroundColor: 'var(--color-teal-50)',
      border: '1px solid var(--color-teal-200)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 1px 3px rgba(12, 112, 117, 0.05)',
    },
    elevated: {
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 30px rgba(10, 14, 20, 0.12)',
    },
  };
  
  return (
    <div 
      className={`${paddingClasses[padding]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
    >
      {children}
    </div>
  );
};
