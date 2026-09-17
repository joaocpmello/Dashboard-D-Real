import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={
        'h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 text-sm text-ink-900 dark:text-ink-100 ' +
        'placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
        `disabled:bg-ink-50 dark:disabled:bg-ink-900 disabled:text-ink-500 dark:disabled:text-ink-600 ${className}`
      }
      {...rest}
    />
  );
}

export function Select({
  className = '',
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      className={
        'h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 text-sm text-ink-900 dark:text-ink-100 ' +
        'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
        `disabled:bg-ink-50 dark:disabled:bg-ink-900 ${className}`
      }
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({
  htmlFor,
  children,
  className = '',
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300 ${className}`}
    >
      {children}
    </label>
  );
}
