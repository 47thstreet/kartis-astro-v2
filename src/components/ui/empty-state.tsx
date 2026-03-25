import { cn } from '@/lib/utils';

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center', className)}>
      <h2 className='text-lg font-medium'>{title}</h2>
      <p className='mt-2 text-sm text-white/70'>{description}</p>
    </div>
  );
}
