import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api, api, call, queryClient, uploadFile, type UploadPurpose } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { acceptTokens, useSession } from '@/api/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Chips } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { maskMobile } from '@/lib/format';
import { pickDocument, pickPhoto } from '@/lib/pick-file';
import { colors, radius, space } from '@/theme/tokens';

const STATES = ['Rajasthan', 'Gujarat', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Haryana', 'Delhi', 'Punjab'];

type Errors = Partial<Record<string, string>>;

/** Step 3: create the plumber or retailer profile. Registration returns tokens for the new identity. */
export default function Register() {
  const { role } = useLocalSearchParams<{ role: 'plumber' | 'retailer' }>();
  const isPlumber = role !== 'retailer';
  const session = useSession();
  const phone = session.status === 'signedIn' ? session.user.phone : undefined;

  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Rajasthan');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [experience, setExperience] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [gstin, setGstin] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  // Onboarding documents upload as soon as they are picked (as the guest) and move to the shop on registration.
  const [shopPhoto, setShopPhoto] = useState<{ key: string; uri: string } | null>(null);
  const [gstCertificate, setGstCertificate] = useState<{ key: string; name: string } | null>(null);
  const [uploading, setUploading] = useState<UploadPurpose | null>(null);
  const [dealerId, setDealerId] = useState<string | undefined>();
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const { data: stores } = $api.useQuery('get', '/api/v1/app/stores', { params: { query: { pageSize: 20 } } }, { enabled: isPlumber });

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 3) e.name = isPlumber ? 'Enter your full name as per Aadhaar.' : "Enter the owner's full name.";
    if (!isPlumber && shopName.trim().length < 3) e.shopName = 'Enter the shop name.';
    if (!isPlumber && address.trim().length < 5) e.address = 'Enter the shop address.';
    if (city.trim().length < 2) e.city = 'Enter your city.';
    if (!/^[1-9]\d{5}$/.test(pincode)) e.pincode = 'PIN code must be 6 digits.';
    if (!isPlumber && email && !/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email, or leave it empty.';
    if (!isPlumber && pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) e.pan = 'Enter a valid 10-character PAN, or leave it empty.';
    if (!isPlumber && gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.toUpperCase())) e.gstin = 'Enter a valid 15-character GSTIN, or leave it empty.';
    if (isPlumber && experience && !/^\d{1,2}$/.test(experience)) e.experience = 'Years of experience, e.g. 6.';
    if (!consent) e.consent = 'Please accept to continue.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setFailure(null);
    try {
      const tokens = isPlumber
        ? await call(
            api.POST('/api/v1/app/plumbers/register', {
              body: {
                name: name.trim(),
                city: city.trim(),
                state,
                pincode,
                experienceYears: experience ? Number(experience) : undefined,
                specialization: specialization.trim() || undefined,
                preferredRetailerId: dealerId,
              },
            }),
          )
        : await call(
            api.POST('/api/v1/app/retailers/register', {
              body: {
                shopName: shopName.trim(),
                ownerName: name.trim(),
                address: address.trim(),
                city: city.trim(),
                state,
                pincode,
                gstin: gstin.trim().toUpperCase() || undefined,
                email: email.trim() || undefined,
                pan: pan || undefined,
                shopPhotoKey: shopPhoto?.key,
                gstCertificateKey: gstCertificate?.key,
              },
            }),
          );
      queryClient.clear();
      await acceptTokens(tokens as Parameters<typeof acceptTokens>[0]);
    } catch (err) {
      setFailure(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<AppHeader back eyebrow="Levik Luxury" title={isPlumber ? 'Business Verification' : 'Dealer Registration'} />}
      footer={
        <View style={styles.footer}>
          <Button title="Activate Account & Enter App" icon="auto_awesome" onPress={submit} loading={busy} disabled={uploading !== null} />
        </View>
      }
    >
      <View style={styles.steps}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.step, i < 3 && styles.stepDone]} />
        ))}
      </View>
      <View style={styles.stepRow}>
        <Badge label={`Step 3 of 3: ${isPlumber ? 'Trade Profile' : 'Shop Profile'}`} tone="gold" />
        <Text variant="labelMd" color={colors.slate}>
          75% completed
        </Text>
      </View>
      <View style={styles.head}>
        <Badge label={isPlumber ? 'Plumber trade network' : 'Authorized partner network'} tone="neutral" icon="verified_user" uppercase={false} />
        <Text variant="headlineXl" color={colors.inkStrong}>
          {isPlumber ? 'Complete Your Trade Profile' : 'Register Your Shop'}
        </Text>
        <Text variant="bodyLg" color={colors.muted}>
          {isPlumber
            ? 'Provide your details to enable instant reward disbursement and gift delivery.'
            : 'Your shop is reviewed by the Levik team before invoices can earn incentives.'}
        </Text>
      </View>

      <Card style={styles.form}>
        {!isPlumber ? <Field label="Shop name" value={shopName} onChangeText={setShopName} placeholder="Shree Balaji Sanitary Store" error={errors.shopName} /> : null}
        <Field
          label={isPlumber ? 'Full name (as per Aadhaar)' : 'Owner name'}
          value={name}
          onChangeText={setName}
          placeholder={isPlumber ? 'Amit Kumar' : 'Rajesh Agarwal'}
          autoComplete="name"
          error={errors.name}
          suffix={<Icon name="badge" size={20} color={colors.faint} />}
        />
        <Field
          label="Mobile number"
          value={phone ? maskMobile(phone) : ''}
          editable={false}
          suffix={<Badge label="Verified OTP" tone="emerald" icon="check_circle" uppercase={false} />}
        />
        {!isPlumber ? <Field label="Shop address" value={address} onChangeText={setAddress} placeholder="Shop 14, Marble Market, MI Road" multiline error={errors.address} /> : null}
        <View style={styles.gap}>
          <Text variant="labelMd" color={colors.slate}>
            State
          </Text>
          <Chips value={state} onChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} />
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field label="City" value={city} onChangeText={setCity} placeholder="Jaipur" autoComplete="postal-address-locality" error={errors.city} />
          </View>
          <View style={styles.flex}>
            <Field label="PIN code" value={pincode} onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="302001" error={errors.pincode} />
          </View>
        </View>
        {isPlumber ? (
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field label="Experience (years)" value={experience} onChangeText={(t) => setExperience(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholder="6" error={errors.experience} />
            </View>
            <View style={styles.flex}>
              <Field label="Specialisation" value={specialization} onChangeText={setSpecialization} placeholder="Wall-hung WCs" />
            </View>
          </View>
        ) : (
          <>
            <Field label="GSTIN (optional)" value={gstin} onChangeText={(t) => setGstin(t.toUpperCase().slice(0, 15))} autoCapitalize="characters" placeholder="08AAKFS4821L1Z3" error={errors.gstin} />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="PAN (optional)" value={pan} onChangeText={(t) => setPan(t.toUpperCase().slice(0, 10))} autoCapitalize="characters" placeholder="AAKFS4821L" error={errors.pan} />
              </View>
              <View style={styles.flex}>
                <Field label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="shop@example.com" error={errors.email} />
              </View>
            </View>
          </>
        )}
      </Card>

      {!isPlumber ? (
        <Card style={styles.gap}>
          <View style={styles.rowBetween}>
            <Text variant="labelLg" color={colors.inkStrong}>
              Shop documents
            </Text>
            <Badge label="Speeds up approval" tone="emerald" uppercase={false} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shopPhoto ? 'Change shop photo' : 'Add shop photo'}
            disabled={uploading !== null}
            onPress={() =>
              void (async () => {
                const file = await pickPhoto([4, 3]);
                if (!file) return;
                setUploading('shop-photo');
                setFailure(null);
                try {
                  setShopPhoto({ key: await uploadFile(file, 'shop-photo'), uri: file.uri });
                } catch (err) {
                  setFailure(errorMessage(err));
                } finally {
                  setUploading(null);
                }
              })()
            }
            style={styles.doc}
          >
            {shopPhoto ? <Image source={{ uri: shopPhoto.uri }} style={styles.docThumb} contentFit="cover" /> : <Icon name="add_a_photo" size={24} color={colors.slate} />}
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                {uploading === 'shop-photo' ? 'Uploading…' : shopPhoto ? 'Shop photo added' : 'Shop front photo'}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Plumbers see it when choosing where they bought
              </Text>
            </View>
            <Icon name={shopPhoto ? 'check_circle' : 'chevron_right'} size={20} color={shopPhoto ? colors.emerald : colors.faint} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={gstCertificate ? 'Change GST certificate' : 'Add GST certificate'}
            disabled={uploading !== null}
            onPress={() =>
              void (async () => {
                const file = await pickDocument();
                if (!file) return;
                setUploading('gst-certificate');
                setFailure(null);
                try {
                  setGstCertificate({ key: await uploadFile(file, 'gst-certificate'), name: file.name });
                } catch (err) {
                  setFailure(errorMessage(err));
                } finally {
                  setUploading(null);
                }
              })()
            }
            style={styles.doc}
          >
            <Icon name="description" size={24} color={gstCertificate ? colors.emeraldDeep : colors.slate} />
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
                {uploading === 'gst-certificate' ? 'Uploading…' : (gstCertificate?.name ?? 'GST registration certificate')}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                PDF or photo · optional if not GST registered
              </Text>
            </View>
            <Icon name={gstCertificate ? 'check_circle' : 'chevron_right'} size={20} color={gstCertificate ? colors.emerald : colors.faint} />
          </Pressable>
        </Card>
      ) : null}

      {isPlumber ? (
        <Card style={styles.gap}>
          <View style={styles.rowBetween}>
            <Text variant="labelLg" color={colors.inkStrong}>
              Primary wholesale dealer
            </Text>
            <Badge label="Optional" tone="neutral" uppercase={false} />
          </View>
          {(stores?.items ?? []).map((s) => {
            const active = dealerId === s.id;
            return (
              <Pressable key={s.id} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setDealerId(active ? undefined : s.id)} style={[styles.dealer, active && styles.dealerActive]}>
                <Icon name="storefront" size={20} color={active ? colors.goldInk : colors.slate} />
                <View style={styles.flex}>
                  <Text variant="labelLg" color={colors.inkStrong}>
                    {s.shopName}
                  </Text>
                  <Text variant="bodySm" color={colors.muted}>
                    {s.city}, {s.state} · {s.id}
                  </Text>
                </View>
                {active ? <Icon name="check_circle" size={20} color={colors.emerald} /> : null}
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent((c) => !c)} style={styles.consent}>
        <View style={[styles.check, consent && styles.checkOn]}>{consent ? <Icon name="check" size={16} color={colors.white} /> : null}</View>
        <Text variant="body" color={colors.ink} style={styles.flex}>
          I authorise <Text variant="labelLg" color={colors.inkStrong}>Levik Luxury Sanitaryware</Text> to verify my credentials for rewards disbursement and tax compliance (TDS under Section 194R).
        </Text>
      </Pressable>
      {errors.consent ? (
        <Text variant="bodySm" color={colors.error}>
          {errors.consent}
        </Text>
      ) : null}

      <View style={styles.privacy}>
        <Icon name="shield" size={18} color={colors.slate} />
        <Text variant="bodySm" color={colors.muted} style={styles.flex}>
          Data privacy guarantee: full Aadhaar numbers are never stored. Aadhaar KYC can be completed from your profile after activation.
        </Text>
      </View>

      {failure ? (
        <View style={styles.error}>
          <Icon name="error_outline" size={18} color={colors.error} />
          <Text variant="body" color={colors.error} style={styles.flex}>
            {failure}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh },
  stepDone: { backgroundColor: colors.goldInk },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  head: { gap: 8 },
  form: { gap: space.lg },
  gap: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex: { flex: 1 },
  dealer: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  dealerActive: { borderColor: colors.gold, backgroundColor: colors.goldWash },
  consent: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceLow },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  privacy: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  error: { flexDirection: 'row', gap: 8, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.errorWash },
  footer: { paddingBottom: space.sm },
  doc: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  docThumb: { width: 56, height: 42, borderRadius: radius.md },
});
