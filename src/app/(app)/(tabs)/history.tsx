import { useSession } from '@/api/session';
import { Passbook } from '@/features/plumber/passbook';
import { RetailerLedger } from '@/features/retailer/ledger';

export default function History() {
  const session = useSession();
  return session.status === 'signedIn' && session.user.role === 'retailer' ? <RetailerLedger /> : <Passbook />;
}
