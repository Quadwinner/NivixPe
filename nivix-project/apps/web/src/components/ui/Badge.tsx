import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'onchain';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { 
      backgroundColor: 'var(--color-ink-100)', 
      color: 'var(--color-ink-700)' 
    },
    success: { 
      backgroundColor: 'rgba(0, 196, 140, 0.12)', 
      color: '#00C48C' 
    },
    warning: { 
      backgroundColor: 'rgba(255, 184, 0, 0.12)', 
      color: '#D4990A' 
    },
    error: { 
      backgroundColor: 'rgba(255, 77, 79, 0.12)', 
      color: '#FF4D4F' 
    },
    info: { 
      backgroundColor: 'rgba(123, 189, 232, 0.12)', 
      color: '#3A78C4' 
    },
    onchain: { 
      backgroundColor: 'rgba(15, 150, 136, 0.12)', 
      color: '#0F9688' 
    },
  };
  
  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-display ${className}`}
      style={{
        ...variantStyles[variant],
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </span>
  );
};
