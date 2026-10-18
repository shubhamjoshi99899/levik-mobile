/** Indian number formatting (lakh/crore grouping), as required by the design system. */
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNumber = (n: number) => inr.format(n);
/** "₹ 2,48,500" with a non-breaking space between symbol and figure. */
export const formatINR = (n: number, decimals = false) => `₹ ${(decimals ? inr2 : inr).format(n)}`;
export const formatPoints = (n: number) => `${inr.format(n)} pts`;
export const signedPoints = (credit: number, debit: number) => (credit ? `+${inr.format(credit)}` : `−${inr.format(debit)}`);

const day = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const time = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' });

export function formatDate(iso?: string | null) {
  return iso ? day.format(new Date(iso)) : '—';
}

/** "Today, 02:40 pm" / "Yesterday, 05:15 pm" / "12 Oct 2026". */
export function formatRelative(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86_400_000);
  if (diff === 0) return `Today, ${time.format(d)}`;
  if (diff === 1) return `Yesterday, ${time.format(d)}`;
  return day.format(d);
}

/** "+91 98290 11234" → "+91 98290 •••34" style masking for display. */
export function maskMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : mobile;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Namaste' : 'Good evening';
}

export const firstName = (name?: string) => (name ?? '').trim().split(/\s+/)[0] ?? '';
