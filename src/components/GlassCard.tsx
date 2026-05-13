import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function GlassCard({ children, className, glow }: {
  children: ReactNode; className?: string; glow?: 'primary' | 'success' | 'accent';
}) {
  return (
    <div className={cn(
      'glass rounded-xl p-6',
      glow === 'primary' && 'glow-primary',
      glow === 'success' && 'glow-success',
      glow === 'accent' && 'glow-accent',
      className
    )}>
      {children}
    </div>
  );
}
