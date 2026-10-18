import { useSession } from '@/api/session';
import { PlumberProfile } from '@/features/plumber/profile';
import { RetailerProfile } from '@/features/retailer/profile';

export default function Profile() {
  const session = useSession();
  return session.status === 'signedIn' && session.user.role === 'retailer' ? <RetailerProfile /> : <PlumberProfile />;
}
