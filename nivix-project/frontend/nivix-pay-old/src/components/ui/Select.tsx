import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
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
      <div className="relative">
        <select
          className={`input appearance-none ${error ? 'border-red-500' : ''} ${className}`}
          style={{
            borderColor: error ? 'var(--color-error)' : undefined,
          }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4" style={{ color: 'var(--text-secondary)' }}>
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
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
