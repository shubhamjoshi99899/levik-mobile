import { useSession } from '@/api/session';
import { PlumberHome } from '@/features/plumber/home';
import { RetailerHome } from '@/features/retailer/home';

export default function Home() {
  const session = useSession();
  return session.status === 'signedIn' && session.user.role === 'retailer' ? <RetailerHome /> : <PlumberHome />;
}
