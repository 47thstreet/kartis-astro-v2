import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`rounded-2xl p-12 text-center ${className ?? ''}`}
      style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
      {icon && (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(139,92,246,0.08)', boxShadow: '0 0 0 1px rgba(139,92,246,0.15)' }}>
          {icon}
        </div>
      )}
      <p className="text-sm font-bold text-white/50">{title}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/25 max-w-xs mx-auto">{description}</p>
      {action && (
        <a href={action.href}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-5 text-[13px] font-semibold text-white hover:bg-violet-500 transition-colors">
          {action.label}
        </a>
      )}
    </div>
  );
}
