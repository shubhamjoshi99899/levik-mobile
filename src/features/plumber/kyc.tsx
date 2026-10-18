import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { $api } from '@/api/client';
import { PreviewBanner } from '@/components/preview-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, HeroCard } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { OtpInput } from '@/components/ui/otp-input';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { formatINR, formatRelative } from '@/lib/format';
import { AADHAAR } from '@/mocks';
import { colors, radius, space, type as typeScale } from '@/theme/tokens';

/**
 * Aadhaar KYC — UI ONLY (mock). UIDAI OTP needs a licensed KYC provider; for the POC any 6-digit code
 * is accepted and nothing is sent to the API. KYC status shown elsewhere still comes from the API
 * (admins verify plumbers in the portal).
 */
const BANNER = 'Aadhaar OTP verification is a design preview. No data leaves this phone and your KYC status is unchanged.';

function KycHeader({ title }: { title: string }) {
  return <AppHeader back title={title} eyebrow="UIDAI · 256-bit SSL" right={<Badge label="UIDAI" tone="neutral" icon="lock" uppercase={false} />} />;
}

function Steps({ step, label }: { step: 1 | 2; label: string }) {
  return (
    <Card style={styles.gap}>
      <View style={styles.rowBetween}>
        <Text variant="labelSm" color={colors.inkStrong}>
          Step {step} of 2
        </Text>
        <Badge label={label} tone="gold" uppercase={false} />
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: step === 1 ? '50%' : '100%' }]} />
      </View>
    </Card>
  );
}

export function KycIntroScreen() {
  const router = useRouter();
  const me = $api.useQuery('get', '/api/v1/app/plumbers/me');
  const [digits, setDigits] = useState('');
  const [masked, setMasked] = useState(true);
  const [consent, setConsent] = useState(false);
  const complete = digits.length === 12;
  const groups = [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12)];

  return (
    <Screen
      header={<KycHeader title="Aadhaar Verification" />}
      footer={
        <View style={styles.footer}>
          <Button title="Get Aadhaar OTP" trailingIcon="arrow_forward" disabled={!complete || !consent} onPress={() => router.push({ pathname: '/kyc/otp', params: { last4: digits.slice(8) } })} />
          <Text variant="bodySm" color={colors.muted} style={styles.center}>
            A 6-digit one-time password will be sent to your UIDAI-registered mobile number.
          </Text>
        </View>
      }
    >
      <PreviewBanner text={BANNER} />
      <Steps step={1} label="Aadhaar details" />
      <Badge label="Government UIDAI verification" tone="neutral" icon="verified_user" />
      <Text variant="headlineXl" color={colors.inkStrong}>
        Verify Your Aadhaar Identity
      </Text>
      <Text variant="bodyLg" color={colors.muted}>
        Government verification is required for direct bank UPI transfers and rewards above {formatINR(2000)}, as per Section 194R tax guidelines.
      </Text>

      <View style={styles.secure}>
        <View style={styles.secureIcon}>
          <Icon name="shield_lock" color={colors.white} />
        </View>
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Bank-grade 256-bit encryption
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Levik never stores your full Aadhaar number or biometrics. Only the last 4 digits are kept.
          </Text>
        </View>
      </View>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="credit_card" color={colors.goldInk} />
            <Text variant="labelLg" color={colors.inkStrong}>
              12-digit Aadhaar number
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setMasked((m) => !m)} style={styles.row}>
            <Icon name={masked ? 'visibility_off' : 'visibility'} size={18} color={colors.slate} />
            <Text variant="labelMd" color={colors.slate}>
              {masked ? 'Masked' : 'Shown'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.aadhaar}>
          {groups.map((g, i) => (
            <View key={i} style={styles.group}>
              <Text variant="headlineMd" color={colors.inkStrong} style={styles.groupText}>
                {i < 2 && masked ? '•'.repeat(g.length).padEnd(4, ' ') : g.padEnd(4, ' ')}
              </Text>
            </View>
          ))}
          <TextInput
            value={digits}
            onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 12))}
            keyboardType="number-pad"
            maxLength={12}
            accessibilityLabel="Aadhaar number"
            style={styles.overlayInput}
            caretHidden
          />
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="check_circle" size={16} color={complete ? colors.emerald : colors.faint} />
            <Text variant="labelMd" color={complete ? colors.emeraldDeep : colors.muted}>
              {digits.length} of 12 digits entered
            </Text>
          </View>
          <Text variant="bodySm" color={colors.muted}>
            Card / e-Aadhaar
          </Text>
        </View>
        {me.data ? (
          <View style={styles.trade}>
            <Icon name="badge" color={colors.navy} />
            <View>
              <Text variant="labelSm" color={colors.slate}>
                Registered trade pro
              </Text>
              <Text variant="labelLg" color={colors.inkStrong}>
                {me.data.name} • {me.data.id}
              </Text>
            </View>
          </View>
        ) : null}
      </Card>

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent((c) => !c)} style={styles.consent}>
        <View style={[styles.check, consent && styles.checkOn]}>{consent ? <Icon name="check" size={16} color={colors.white} /> : null}</View>
        <Text variant="body" color={colors.ink} style={styles.flex}>
          I consent to <Text variant="labelLg" color={colors.inkStrong}>Levik Luxury Sanitaryware Pvt. Ltd.</Text> verifying my identity via UIDAI for trade rewards accreditation, TDS compliance under IT Act Section 194R and direct bank payouts.
        </Text>
      </Pressable>

      <View style={styles.rowBetween}>
        <Text variant="labelSm" color={colors.slate}>
          Why Aadhaar is required
        </Text>
        <Text variant="labelMd" color={colors.goldInk}>
          Gold tier perks
        </Text>
      </View>
      {[
        ['payments', 'Instant UPI & bank cashouts', 'Zero-fee settlement to SBI, HDFC, ICICI accounts'],
        ['featured_seasonal_and_gifts', 'Unlock high-value gifts', 'Redeem smart TVs, geysers & power tools'],
        ['receipt_long', 'TDS Section 194R compliant', 'Form 16A and tax deduction credits'],
      ].map(([icon, title, detail]) => (
        <Card key={title} style={styles.perk}>
          <View style={styles.perkIcon}>
            <Icon name={icon} color={colors.goldInk} />
          </View>
          <View style={styles.flex}>
            <Text variant="labelLg" color={colors.inkStrong}>
              {title}
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              {detail}
            </Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

export function KycOtpScreen() {
  const router = useRouter();
  const { last4 = AADHAAR.last4 } = useLocalSearchParams<{ last4?: string }>();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(AADHAAR.otpSeconds);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = () => {
    setBusy(true);
    setTimeout(() => router.replace({ pathname: '/kyc/success', params: { last4 } }), 700);
  };

  return (
    <Screen
      header={<KycHeader title="Aadhaar OTP Verification" />}
      footer={
        <View style={styles.footer}>
          <Button title="Verify & Complete KYC" icon="verified_user" onPress={verify} loading={busy} disabled={code.length !== 6} />
        </View>
      }
    >
      <PreviewBanner text={`${BANNER} Enter any 6 digits.`} />
      <Steps step={2} label="OTP authentication" />
      <Badge label="UIDAI OTP sent" tone="emerald" icon="sms" uppercase={false} />
      <Text variant="headlineXl" color={colors.inkStrong}>
        Enter 6-Digit Aadhaar OTP
      </Text>
      <Text variant="bodyLg" color={colors.muted}>
        A one-time password has been sent by UIDAI to the mobile number linked with your Aadhaar ending in{' '}
        <Text variant="labelLg" color={colors.inkStrong}>
          •••• {AADHAAR.linkedMobile.slice(-3)}
        </Text>
        .
      </Text>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="badge" color={colors.slate} />
            <View>
              <Text variant="labelSm" color={colors.slate}>
                Aadhaar number
              </Text>
              <Text variant="labelLg" color={colors.inkStrong}>
                XXXX-XXXX-{last4}
              </Text>
            </View>
          </View>
          <Badge label="Verified" tone="emerald" uppercase={false} />
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="smartphone" color={colors.slate} />
            <View>
              <Text variant="labelSm" color={colors.slate}>
                Linked mobile
              </Text>
              <Text variant="labelLg" color={colors.inkStrong}>
                {AADHAAR.linkedMobile}
              </Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text variant="labelMd" color={colors.goldInk}>
              Change
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Verification code
          </Text>
          <View style={styles.row}>
            <Icon name="schedule" size={16} color={seconds > 0 ? colors.goldInk : colors.error} />
            <Text variant="labelMd" color={seconds > 0 ? colors.goldInk : colors.error}>
              {seconds > 0 ? `Expires in ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` : 'Code expired'}
            </Text>
          </View>
        </View>
        <OtpInput value={code} onChange={setCode} autoFocus />
        <View style={styles.row}>
          <Button title="Resend SMS" icon="sync" variant="soft" size="sm" style={styles.flex} onPress={() => setSeconds(AADHAAR.otpSeconds)} disabled={seconds > 0} />
          <Button title="Send via WhatsApp" icon="chat" variant="soft" size="sm" style={styles.flex} onPress={() => setSeconds(AADHAAR.otpSeconds)} disabled={seconds > 0} />
        </View>
      </Card>

      <View style={styles.guide}>
        <Icon name="info" color={colors.navy} />
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong}>
            UIDAI official guidelines
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            The OTP is valid for 10 minutes and issued only by UIDAI, Govt of India. Never share it with anyone, including Levik staff.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

export function KycSuccessScreen() {
  const router = useRouter();
  const { last4 = AADHAAR.last4 } = useLocalSearchParams<{ last4?: string }>();
  const me = $api.useQuery('get', '/api/v1/app/plumbers/me');
  return (
    <Screen header={<KycHeader title="Aadhaar Verification Success" />}>
      <PreviewBanner text="This confirmation is a design preview. Your actual KYC is approved by the Levik team in the admin portal." />
      <HeroCard style={styles.successHero}>
        <View style={styles.seal}>
          <Icon name="verified_user" size={44} color={colors.navy} />
        </View>
        <Badge label="Levik ceramics • privilege club" tone="soft" icon="workspace_premium" />
        <Text variant="headlineXl" color={colors.white} style={styles.center}>
          Aadhaar KYC Verified!
        </Text>
        <Text variant="body" color={colors.onNavyMuted} style={styles.center}>
          Your contractor identity has been authenticated with the UIDAI registry.
        </Text>
        <Badge label="Step 3 of 3 • Identity fully certified" tone="gold" uppercase={false} />
      </HeroCard>

      <View style={styles.bonus}>
        <View style={styles.bonusIcon}>
          <Icon name="monetization_on" size={26} color={colors.goldInk} />
        </View>
        <View style={styles.flex}>
          <View style={styles.row}>
            <Text variant="labelSm" color={colors.goldInk}>
              Verification reward
            </Text>
            <Badge label="Instant" tone="emerald" />
          </View>
          <Text variant="headlineSm" color={colors.inkStrong}>
            +{AADHAAR.bonusPoints} bonus points
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Added to your Levik trade wallet balance
          </Text>
        </View>
      </View>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="badge" color={colors.navy} />
            <Text variant="labelLg" color={colors.inkStrong}>
              Contractor e-KYC dossier
            </Text>
          </View>
          <Badge label="Govt compliant" tone="neutral" />
        </View>
        {[
          ['Full legal name', me.data?.name ?? '—'],
          ['Aadhaar number', `•••• ${last4}`],
          ['Certificate ref', AADHAAR.certificateRef],
          ['Timestamp', formatRelative(new Date().toISOString())],
        ].map(([label, value]) => (
          <View key={label} style={styles.rowBetween}>
            <Text variant="body" color={colors.muted}>
              {label}
            </Text>
            <Text variant="labelLg" color={colors.inkStrong}>
              {value}
            </Text>
          </View>
        ))}
      </Card>

      <Text variant="headlineSm" color={colors.inkStrong}>
        Unlocked privileges
      </Text>
      {[
        ['account_balance', 'Direct UPI bank payouts', 'Ready', 'Instant daily bank settlements enabled.'],
        ['redeem', 'Milestone gift catalogue', 'Unlocked', 'Claim smart TVs, geysers, fittings and master toolkits.'],
        ['description', 'Section 194R tax exemption', 'Active', 'TDS exemption certificate generated automatically.'],
        ['military_tech', 'Master Plumber Guild tier', '1.25x rate', 'Bonus multiplier on every Levik QR code scanned on site.'],
      ].map(([icon, title, badge, detail]) => (
        <Card key={title} style={styles.perk}>
          <View style={styles.perkIcon}>
            <Icon name={icon} color={colors.goldInk} />
          </View>
          <View style={styles.flex}>
            <View style={styles.row}>
              <Text variant="labelLg" color={colors.inkStrong}>
                {title}
              </Text>
              <Badge label={badge} tone="emerald" uppercase={false} />
            </View>
            <Text variant="bodySm" color={colors.muted}>
              {detail}
            </Text>
          </View>
        </Card>
      ))}

      <Button title="Go to Plumber Dashboard" trailingIcon="arrow_forward" onPress={() => router.dismissTo('/')} />
      <Button title="View Trade Wallet & Passbook" icon="account_balance_wallet" variant="outline" onPress={() => router.dismissTo('/history')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: colors.goldInk, borderRadius: 3 },
  secure: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceMid },
  secureIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  aadhaar: { flexDirection: 'row', gap: space.sm, padding: space.sm, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  group: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surface },
  groupText: { letterSpacing: 4, fontVariant: ['tabular-nums'] },
  overlayInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, ...typeScale.headlineMd } as never,
  trade: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  consent: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceLow },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  perk: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  perkIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.goldWash, alignItems: 'center', justifyContent: 'center' },
  guide: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceMid },
  successHero: { alignItems: 'center', gap: space.md },
  seal: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  bonus: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.goldWash, borderWidth: 1, borderColor: colors.goldLight },
  bonusIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: space.sm, paddingBottom: space.sm },
});
