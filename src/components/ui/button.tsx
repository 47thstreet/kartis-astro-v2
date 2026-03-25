import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'border border-white/15 bg-white/8 text-white hover:bg-white/16 hover:border-white/25',
        primary:
          'bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow-[0_8px_32px_rgba(99,102,241,0.45)] hover:brightness-110',
        ghost: 'text-white/90 hover:bg-white/10'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
