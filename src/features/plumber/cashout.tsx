import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api } from '@/api/client';
import { useSession } from '@/api/session';
import { PreviewBanner } from '@/components/preview-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, HeroCard } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';

import { Text } from '@/components/ui/text';
import { formatINR, formatNumber } from '@/lib/format';
import { plumberTier } from '@/lib/tier';
import { CASHOUT, PAYOUT_ACCOUNTS } from '@/mocks';
import { colors, radius, space } from '@/theme/tokens';
import { CashoutSkeleton } from '@/components/skeletons';

/**
 * UPI / bank cashout — UI ONLY (mock). Uses the real wallet balance, but no payout request is sent:
 * the API has no cashout endpoint yet. Step 2 shows the confirmation the real flow will produce.
 */
export function CashoutScreen() {
  const router = useRouter();
  const session = useSession();
  const name = session.status === 'signedIn' ? session.user.name : undefined;
  const wallet = $api.useQuery('get', '/api/v1/app/wallet');
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState(PAYOUT_ACCOUNTS[0].id);
  const [done, setDone] = useState(false);

  if (wallet.isLoading)
    return (
      <Screen header={<AppHeader back eyebrow="Bank encrypted" title="Instant UPI Payout" />}>
        <CashoutSkeleton />
      </Screen>
    );
  const balance = wallet.data?.available ?? 0;
  const tier = plumberTier(wallet.data?.lifetime ?? 0);
  const value = Number(amount || 0);
  const valid = value >= CASHOUT.minimum && value <= balance;
  const account = PAYOUT_ACCOUNTS.find((a) => a.id === channel)!;
  const net = value - CASHOUT.fee - CASHOUT.tds;

  if (done) {
    return (
      <Screen header={<AppHeader back title="Payout Requested" />}>
        <PreviewBanner text="No money was transferred. Cash payouts will go live once the payout API is connected." />
        <Card style={styles.success}>
          <View style={styles.successIcon}>
            <Icon name="task_alt" size={40} color={colors.emeraldDeep} />
          </View>
          <Text variant="headlineMd" color={colors.inkStrong} style={styles.center}>
            {formatINR(net, true)} on its way
          </Text>
          <Text variant="body" color={colors.muted} style={styles.center}>
            To {account.detail} · {account.speed}. You will get an SMS when the bank confirms.
          </Text>
          <Button title="Back to passbook" icon="receipt_long" onPress={() => router.replace('/history')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={<AppHeader back eyebrow="Bank encrypted" title="Instant UPI Payout" />}
      footer={
        <View style={styles.footer}>
          <Button title={`Withdraw ${formatINR(value || 0)} to ${account.kind === 'upi' ? 'UPI' : 'bank'}`} icon="bolt" trailingIcon="arrow_forward" onPress={() => setDone(true)} disabled={!valid} />
          <Text variant="bodySm" color={colors.muted} style={styles.center}>
            Need help? Guild Desk 1800-419-LEVIK
          </Text>
        </View>
      }
    >
      <PreviewBanner text="Cashout is a design preview. Your balance is real; no transfer is made." />
      <View style={styles.rowBetween}>
        <Text variant="labelMd" color={colors.goldInk}>
          ● STEP 1 OF 2 • Payout details
        </Text>
        <Badge label="NPCI 256-bit" tone="neutral" icon="verified_user" uppercase={false} />
      </View>

      <HeroCard style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="account_balance_wallet" size={18} color={colors.onNavyMuted} />
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Withdrawable balance
            </Text>
          </View>
          <Badge label="Zero fee" tone="emerald" icon="bolt" uppercase={false} />
        </View>
        <View style={styles.balance}>
          <Text variant="display" color={colors.white}>
            {formatINR(balance)}
          </Text>
          <Text variant="body" color={colors.onNavyMuted}>
            / {formatNumber(balance)} points
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text variant="bodySm" color={colors.onNavyMuted}>
            Plumber partner: <Text variant="labelMd" color={colors.white}>{name}</Text>
          </Text>
          <Badge label={`Tier: ${tier.name}`} tone="soft" uppercase={false} />
        </View>
      </HeroCard>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Text variant="headlineSm" color={colors.inkStrong}>
            Enter cashout amount
          </Text>
          <Text variant="labelMd" color={colors.slate}>
            Min: {formatINR(CASHOUT.minimum)}
          </Text>
        </View>
        <View style={styles.row}>
          {[...CASHOUT.presets, balance].map((v, i) => {
            const active = value === v;
            return (
              <Pressable key={`${v}-${i}`} accessibilityRole="button" disabled={v > balance} onPress={() => setAmount(String(v))} style={[styles.preset, active && styles.presetOn, v > balance && styles.presetOff]}>
                <Text variant="labelLg" color={active ? colors.white : colors.navy}>
                  {formatINR(v)}
                </Text>
                {i === CASHOUT.presets.length ? (
                  <Text variant="labelSm" color={active ? colors.goldLight : colors.goldInk}>
                    Full payout
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Field
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/\D/g, '').slice(0, 7))}
          keyboardType="number-pad"
          placeholder="0"
          accessibilityLabel="Cashout amount"
          prefix={<Text variant="headlineMd" color={colors.inkStrong}>₹</Text>}
          suffix={valid ? <Icon name="check_circle" color={colors.emerald} /> : null}
          error={value > balance ? 'Amount is more than your balance.' : value > 0 && value < CASHOUT.minimum ? `Minimum payout is ${formatINR(CASHOUT.minimum)}.` : undefined}
          hint={valid ? 'Eligible for instant zero-fee release.' : undefined}
        />
      </Card>

      <View style={styles.rowBetween}>
        <Text variant="headlineSm" color={colors.inkStrong}>
          Select transfer channel
        </Text>
        <Text variant="labelMd" color={colors.emeraldDeep}>
          100% guaranteed
        </Text>
      </View>
      {PAYOUT_ACCOUNTS.map((a) => {
        const active = channel === a.id;
        return (
          <Pressable key={a.id} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setChannel(a.id)} style={[styles.channel, active && styles.channelOn]}>
            <View style={styles.channelIcon}>
              <Icon name={a.kind === 'upi' ? 'qr_code_2' : 'account_balance'} color={colors.navy} />
            </View>
            <View style={styles.flex}>
              <View style={styles.row}>
                <Text variant="labelLg" color={colors.inkStrong}>
                  {a.title}
                </Text>
                <Badge label={a.speed} tone={a.kind === 'upi' ? 'gold' : 'neutral'} uppercase={false} />
              </View>
              <Text variant="body" color={colors.inkStrong}>
                {a.detail}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                {a.meta}
              </Text>
            </View>
            <View style={[styles.radio, active && styles.radioOn]}>{active ? <Icon name="check" size={14} color={colors.white} /> : null}</View>
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" disabled style={styles.addAccount}>
        <Icon name="add_circle" color={colors.navy} />
        <Text variant="labelLg" color={colors.navy}>
          Add new UPI ID or bank account
        </Text>
      </Pressable>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Text variant="labelSm" color={colors.slate}>
            Settlement breakdown
          </Text>
          <Badge label="TDS exempted" tone="neutral" uppercase={false} />
        </View>
        {[
          ['Requested payout', formatINR(value, true)],
          ['Platform convenience fee', `${formatINR(CASHOUT.fee, true)} (Free)`],
          ['Sec 194R tax provision', formatINR(CASHOUT.tds, true)],
        ].map(([label, v]) => (
          <View key={label} style={styles.rowBetween}>
            <Text variant="body" color={colors.muted}>
              {label}
            </Text>
            <Text variant="labelLg" color={colors.inkStrong}>
              {v}
            </Text>
          </View>
        ))}
        <View style={styles.net}>
          <View>
            <Text variant="labelLg" color={colors.inkStrong}>
              Net credited amount
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              to {account.detail}
            </Text>
          </View>
          <Text variant="headlineLg" color={colors.emeraldDeep}>
            {formatINR(net > 0 ? net : 0, true)}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  balance: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  preset: { flex: 1, minWidth: 90, alignItems: 'center', justifyContent: 'center', paddingVertical: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMid },
  presetOn: { backgroundColor: colors.navy },
  presetOff: { opacity: 0.4 },
  channel: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  channelOn: { borderColor: colors.navy, borderWidth: 1.5 },
  channelIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.navy },
  addAccount: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.sm, height: 52, borderRadius: radius.card, backgroundColor: colors.surfaceLow, opacity: 0.7 },
  net: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  success: { alignItems: 'center', gap: space.md },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.emeraldWash, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: space.sm, paddingBottom: space.sm },
});
