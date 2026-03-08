import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface DriverAvatarDisplayProps {
  avatarUrl: string | null;
  driverName: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const sizeMap = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
};

export default function DriverAvatarDisplay({ avatarUrl, driverName, size = 'sm', className }: DriverAvatarDisplayProps) {
  const initials = driverName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <Avatar className={`${sizeMap[size]} ${className || ''}`}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={driverName} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
