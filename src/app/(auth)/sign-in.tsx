import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import { requestOtp, verifyOtp } from '@/api/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { OtpInput } from '@/components/ui/otp-input';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { colors, radius, space } from '@/theme/tokens';

const RESEND_SECONDS = 30;

/** Phone → OTP sign-in. Verifying signs the user in; the root guard then routes guests to role selection. */
export default function SignIn() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometric, setBiometric] = useState(true);
  const digits = phone.replace(/\D/g, '');
  const validPhone = /^[6-9]\d{9}$/.test(digits);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setError(null);
    setBusy(true);
    try {
      await requestOtp(digits);
      setSentTo(digits);
      setCode('');
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!sentTo) return;
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(sentTo, code);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<AppHeader back eyebrow="Levik Luxury" title="Phone Authentication" />}
      footer={
        <View style={styles.footer}>
          {sentTo ? (
            <Button title="Verify & Continue" trailingIcon="arrow_forward" onPress={verify} loading={busy} disabled={code.length !== 6} />
          ) : (
            <Button title="Send OTP" trailingIcon="arrow_forward" onPress={send} loading={busy} disabled={!validPhone} />
          )}
          <View style={styles.official}>
            <Icon name="lock" size={14} color={colors.slate} />
            <Text variant="labelSm" color={colors.slate}>
              Official Levik Luxury partner app
            </Text>
          </View>
        </View>
      }
    >
      <View style={styles.steps}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.step, i === 0 && styles.stepDone]} />
        ))}
      </View>
      <View style={styles.stepRow}>
        <Badge label="Step 1 of 3: Verification" tone="gold" icon="shield" />
        <Badge label="256-bit SSL" tone="emerald" uppercase={false} />
      </View>
      <View style={styles.intro}>
        <Text variant="headlineXl" color={colors.inkStrong}>
          Mobile Authentication
        </Text>
        <Text variant="bodyLg" color={colors.muted}>
          We will send a 6-digit One Time Password (OTP) to securely bind your trade incentives.
        </Text>
      </View>

      <Card style={styles.gap}>
        <View style={styles.cardHead}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Registered Trade Mobile
          </Text>
          {validPhone ? <Badge label="Ready to verify" tone="emerald" icon="check_circle" uppercase={false} /> : null}
        </View>
        <Field
          value={phone}
          onChangeText={(t) => {
            setPhone(t.replace(/[^\d ]/g, '').slice(0, 11));
            if (sentTo) setSentTo(null);
          }}
          placeholder="98765 43210"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          accessibilityLabel="Mobile number"
          editable={!busy}
          prefix={
            <View style={styles.prefix}>
              <Text variant="labelLg" color={colors.navy}>
                🇮🇳 +91
              </Text>
            </View>
          }
          suffix={validPhone ? <Icon name="check_circle" color={colors.emerald} /> : null}
        />
      </Card>

      {sentTo ? (
        <Card style={[styles.gap, styles.raised]}>
          <View style={styles.cardHead}>
            <View>
              <Text variant="labelSm" color={colors.goldInk}>
                Secure access token
              </Text>
              <Text variant="body" color={colors.muted}>
                OTP sent to <Text variant="labelLg" color={colors.inkStrong}>+91 {sentTo.slice(0, 5)} {sentTo.slice(5)}</Text>
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setSentTo(null)} style={styles.edit}>
              <Icon name="edit" size={16} />
              <Text variant="labelMd" color={colors.navy}>
                Edit
              </Text>
            </Pressable>
          </View>
          <OtpInput value={code} onChange={setCode} autoFocus />
          <View style={styles.cardHead}>
            <Pressable accessibilityRole="button" disabled={cooldown > 0 || busy} onPress={send} style={styles.resend}>
              <Icon name="history" size={18} color={colors.slate} />
              <Text variant="body" color={cooldown > 0 ? colors.muted : colors.navy}>
                {cooldown > 0 ? `Resend in 00:${String(cooldown).padStart(2, '0')}` : 'Resend OTP'}
              </Text>
            </Pressable>
            <Badge label="Get via WhatsApp" tone="neutral" icon="chat" uppercase={false} />
          </View>
        </Card>
      ) : null}

      {error ? (
        <View style={styles.error} accessibilityLiveRegion="assertive">
          <Icon name="error_outline" size={18} color={colors.error} />
          <Text variant="body" color={colors.error} style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.info}>
        <View style={styles.infoIcon}>
          <Icon name="verified_user" size={20} color={colors.goldInk} />
        </View>
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Secured Ledger Identity
          </Text>
          <Text variant="body" color={colors.muted}>
            Verified OTP ensures reward accruals, quarterly incentives and GST invoices are tied securely to your certified trade ID.
          </Text>
        </View>
      </View>

      <Card style={styles.bio}>
        <View style={styles.bioIcon}>
          <Icon name="fingerprint" size={26} color={colors.navy} />
        </View>
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Enable Biometric Login
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Touch ID / Face ID for faster showroom scans
          </Text>
        </View>
        <Switch value={biometric} onValueChange={setBiometric} trackColor={{ true: colors.goldLight, false: colors.border }} thumbColor={colors.white} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh },
  stepDone: { backgroundColor: colors.goldInk },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  intro: { gap: 6 },
  gap: { gap: space.md },
  raised: { borderColor: colors.surfaceHigh },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  prefix: { paddingRight: 10, borderRightWidth: 1, borderRightColor: colors.border },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceLow },
  resend: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  error: { flexDirection: 'row', gap: 8, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.errorWash },
  info: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceMid },
  infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  bio: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surfaceLow },
  bioIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  footer: { gap: space.sm, paddingBottom: space.sm },
  official: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
});
