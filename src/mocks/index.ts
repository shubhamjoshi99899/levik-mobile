/**
 * MOCK DATA — UI-only flows that have no backend yet (agreed scope for the POC):
 *   - UPI / bank cashout
 *   - Aadhaar OTP verification (UIDAI)
 *   - GST tax features of the retailer ledger (GSTR-2B, ITC, statements)
 *   - Territory manager contact
 * Everything else in the app is live API data. Replace these when the backend endpoints exist.
 */

export const TERRITORY_MANAGER = {
  name: 'Rajesh Sharma',
  zone: 'Jaipur Zone',
  phone: '+91 98200 44123',
};

export const PAYOUT_ACCOUNTS = [
  { id: 'upi', kind: 'upi' as const, title: 'Primary UPI ID', detail: 'amit.plumber@okaxis', meta: 'SBI •••• 4412', speed: 'Instant ~30s' },
  { id: 'bank', kind: 'bank' as const, title: 'Direct Bank Transfer', detail: 'State Bank of India •••• 4412', meta: 'IFSC: SBIN0001423 (Civil Lines Branch)', speed: '1-2 hrs' },
];

export const CASHOUT = {
  minimum: 100,
  presets: [500, 1000],
  fee: 0,
  tds: 0,
};

export const AADHAAR = {
  last4: '8924',
  linkedMobile: '+91 98••• ••210',
  otpSeconds: 105,
  /** Any 6-digit code is accepted in the POC; this one is pre-filled hint text. */
  demoOtp: '582941',
  certificateRef: '#UIDAI-LVK-9482103',
  bonusPoints: 150,
};

export const GST = {
  quarter: 'Q3 2024-25',
  period: 'Oct – Dec',
  itcEligible: 58410,
  discrepancies: 0,
  settledAccount: 'HDFC Current A/C',
};
