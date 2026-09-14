import React from 'react';

type SelectProps = {
  children: React.ReactNode;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function Select({ children, defaultValue, onChange, className = '', disabled = false }: SelectProps) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`
        w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm
        text-ink-900 outline-none transition-colors
        focus:border-brand-500 focus:ring-1 focus:ring-brand-500
        disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400
        ${className}
      `}
    >
      {children}
    </select>
  );
}
