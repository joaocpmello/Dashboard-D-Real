import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-ink-100 dark:border-ink-800 px-5 py-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...rest }: CardProps) {
  return (
    <h3 className={`text-sm font-semibold text-ink-800 dark:text-ink-200 ${className}`} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...rest }: CardProps) {
  return (
    <p className={`mt-0.5 text-sm text-ink-500 dark:text-ink-400 ${className}`} {...rest}>
      {children}
    </p>
  );
}

export function CardBody({ className = '', children, ...rest }: CardProps) {
  return (
    <div className={`px-5 py-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
