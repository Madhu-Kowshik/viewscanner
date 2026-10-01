import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverEffect, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800/80 dark:bg-slate-900 transition-all duration-150',
        hoverEffect && 'hover:border-slate-300 hover:shadow-card dark:hover:border-slate-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
