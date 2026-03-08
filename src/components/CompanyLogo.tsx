import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyLogoProps {
  logoUrl: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
};

export default function CompanyLogo({ logoUrl, name, size = 'sm', showName = true, className }: CompanyLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-full border-2 border-border/50 bg-muted flex items-center justify-center overflow-hidden flex-shrink-0',
        sizes[size]
      )}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className={cn(
            'text-muted-foreground',
            size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4.5 w-4.5' : 'h-6 w-6'
          )} />
        )}
      </div>
      {showName && name && (
        <span className={cn(
          'font-display font-bold truncate text-foreground',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
        )}>
          {name}
        </span>
      )}
    </div>
  );
}
