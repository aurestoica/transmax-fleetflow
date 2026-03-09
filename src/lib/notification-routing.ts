import { useAuthStore } from '@/lib/auth-store';

interface NotificationRouteParams {
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  message: string | null;
}

/**
 * Returns the appropriate route for a notification based on user role.
 * Drivers get routed to /driver/* paths, admins to standard paths.
 */
export function getNotificationRoute(n: NotificationRouteParams): string | null {
  const { isDriver, isAdmin } = useAuthStore.getState();
  const driverOnly = isDriver() && !isAdmin();

  if (n.entity_type && n.entity_id) {
    switch (n.entity_type) {
      case 'trip':
        return driverOnly ? '/driver' : `/trips/${n.entity_id}`;
      case 'chat':
        return driverOnly ? `/driver/chat?trip=${n.entity_id}` : `/chat?trip=${n.entity_id}`;
      case 'document':
        return driverOnly ? '/driver/documents' : '/documents';
      case 'vehicle':
        return driverOnly ? '/driver' : `/vehicles/${n.entity_id}`;
      case 'trailer':
        return driverOnly ? '/driver' : `/trailers/${n.entity_id}`;
      case 'driver':
        return driverOnly ? '/driver/profile' : `/drivers/${n.entity_id}`;
      case 'company':
        return driverOnly ? '/driver' : '/settings';
      default:
        break;
    }
  }

  // Fallback: guess from text content
  const text = `${n.title} ${n.message || ''}`.toLowerCase();
  if (text.includes('cursă') || text.includes('cursa') || text.includes('trip'))
    return driverOnly ? '/driver' : '/trips';
  if (text.includes('document'))
    return driverOnly ? '/driver/documents' : '/documents';
  if (text.includes('locație') || text.includes('locatie') || text.includes('gps'))
    return driverOnly ? '/driver/location' : '/map';
  if (text.includes('mesaj') || text.includes('chat'))
    return driverOnly ? '/driver/chat' : '/chat';
  if (text.includes('șofer') || text.includes('sofer') || text.includes('driver'))
    return driverOnly ? '/driver/profile' : '/drivers';

  return null;
}
