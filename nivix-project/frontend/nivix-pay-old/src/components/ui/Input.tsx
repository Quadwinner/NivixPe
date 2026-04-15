import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-xs font-semibold font-display mb-2 uppercase"
          style={{ 
            color: 'var(--text-primary)',
            letterSpacing: '0.12em',
            fontSize: '11px',
          }}
        >
          {label}
        </label>
      )}
      <input
        className={`input ${error ? 'border-red-500' : ''} ${className}`}
        style={{
          borderColor: error ? 'var(--color-error)' : undefined,
        }}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
          {helperText}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs font-body" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
};
