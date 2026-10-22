import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { $api, api, call, refreshAll, uploadFile, type PickedFile } from '@/api/client';
import { errorMessage } from '@/api/errors';
import type { components } from '@/api/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppHeader } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { formatNumber } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import { ProductThumb } from '../shared/parts';
import { DealerPicker } from './dealer-picker';

type Resolved = components['schemas']['ResolvedLabelResponseDto'];

/** A rejected QR is checked again only after it has been out of the camera's view for this long. */
const RESCAN_AFTER_MS = 2500;
type SubmittedScan = components['schemas']['AppScanResponseDto'];

/** Camera (or typed serial) → API label check → proof of sale → submit for admin verification. */
export function ScanScreen() {
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedScan | null>(null);
  const lock = useRef(false);
  // The camera reports the same QR many times a second while it stays in view. After a failed check, ignore
  // that code until it has been out of view for a moment, so one bad label does not loop requests to the API.
  const rejected = useRef<{ code: string; seenAt: number } | null>(null);
  const scroller = useRef<ScrollView>(null);
  // The scanner disappears once a label resolves, so start the product details from the top.
  useEffect(() => scroller.current?.scrollTo({ y: 0, animated: false }), [resolved, submitted]);

  const check = async (raw: string) => {
    if (lock.current) return;
    lock.current = true;
    setChecking(true);
    setError(null);
    try {
      const result = await call(api.GET('/api/v1/app/labels/resolve', { params: { query: { code: raw } } }));
      setCode(raw);
      setResolved(result);
    } catch (e) {
      setError(errorMessage(e));
      rejected.current = { code: raw, seenAt: Date.now() };
      lock.current = false;
    } finally {
      setChecking(false);
    }
  };

  const reset = () => {
    lock.current = false;
    rejected.current = null;
    setCode(null);
    setResolved(null);
    setSubmitted(null);
    setError(null);
    setManual('');
  };

  const onBarcode = (result: BarcodeScanningResult) => {
    const last = rejected.current;
    if (last && last.code === result.data && Date.now() - last.seenAt < RESCAN_AFTER_MS) {
      last.seenAt = Date.now(); // still in view: keep ignoring it
      return;
    }
    void check(result.data);
  };
  const cameraLive = focused && !resolved && Boolean(permission?.granted);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <AppHeader back brand title="Scan QR" />
      </SafeAreaView>
      <ScrollView ref={scroller} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {resolved || submitted ? null : (
        <View style={styles.viewport}>
          {cameraLive ? (
            <CameraView style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={checking ? undefined : onBarcode} />
          ) : null}
          <View style={styles.tint} />
          <View style={styles.controls}>
            <View style={styles.controlPill}>
              <Pressable accessibilityRole="button" accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'} onPress={() => setTorch((t) => !t)} style={styles.control}>
                <Icon name={torch ? 'flash_on' : 'flash_off'} color={colors.white} />
              </Pressable>
              <View style={styles.control}>
                <Icon name="volume_up" color={colors.white} />
              </View>
            </View>
            <Badge label={cameraLive ? 'Sensor active' : resolved ? 'Scan captured' : 'Camera off'} tone="gold" icon="fiber_manual_record" />
          </View>

          {permission && !permission.granted ? (
            <View style={styles.permission}>
              <Icon name="photo_camera" size={36} color={colors.goldLight} />
              <Text variant="labelLg" color={colors.white} style={styles.center}>
                Allow camera access to scan Levik QR labels
              </Text>
              <Button title="Allow camera" variant="gold" size="md" onPress={() => void requestPermission()} />
            </View>
          ) : (
            <View style={styles.frame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              <View style={styles.laser} />
            </View>
          )}

          <View style={styles.hint}>
            <Text variant="body" color={colors.white} style={styles.center}>
              {checking ? 'Verifying label with Levik…' : 'Align the Levik QR code on the label or carton inside the box.'}
            </Text>
          </View>

          <Pressable accessibilityRole="button" onPress={() => setManualOpen((o) => !o)} style={styles.manualToggle}>
            <Icon name="keyboard" color={colors.white} />
            <Text variant="labelLg" color={colors.white}>
              Enter serial number
            </Text>
            <Icon name={manualOpen ? 'expand_less' : 'expand_more'} color={colors.white} />
          </Pressable>
        </View>
        )}

        <View style={[styles.sheet, (resolved || submitted) && styles.sheetFlat]}>
          {manualOpen && !resolved ? (
            <Card style={styles.gap}>
              <Text variant="labelLg" color={colors.inkStrong}>
                Manual authentication
              </Text>
              <Field
                value={manual}
                onChangeText={setManual}
                placeholder="LVK-7K3QX-9MP2D-4"
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Serial number"
                suffix={<Button title="Verify" size="sm" onPress={() => void check(manual)} disabled={manual.trim().length < 4} loading={checking} />}
              />
              <View style={styles.row}>
                <Icon name="info" size={16} color={colors.slate} />
                <Text variant="bodySm" color={colors.muted} style={styles.flex}>
                  The serial is printed under the QR code on the product label (for example LVK-XXXXX-XXXXX-X).
                </Text>
              </View>
            </Card>
          ) : null}

          {error ? (
            <View style={styles.error}>
              <Icon name="error_outline" color={colors.error} />
              <Text variant="body" color={colors.error} style={styles.flex}>
                {error}
              </Text>
            </View>
          ) : null}

          {submitted ? <Submitted scan={submitted} onAgain={reset} /> : resolved && code ? <ResultCard code={code} resolved={resolved} onDone={setSubmitted} onAgain={reset} /> : null}

          <View style={styles.tamper}>
            <Icon name="security" color={colors.error} />
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.error}>
                Tamper-evident protocol
              </Text>
              <Text variant="bodySm" color={colors.inkStrong}>
                Codes are single-use and signature-verified. Suspected duplicate claims are logged and reviewed by the Levik compliance team.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ResultCard({ code, resolved, onDone, onAgain }: { code: string; resolved: Resolved; onDone: (scan: SubmittedScan) => void; onAgain: () => void }) {
  const genuine = resolved.status === 'Available' && resolved.signatureValid !== false;
  // undefined = not chosen yet (defaults to the plumber's registered dealer), null = "No dealer".
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [site, setSite] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: me } = $api.useQuery('get', '/api/v1/app/plumbers/me', {}, { enabled: genuine });
  const primaryId = me?.preferredRetailer?.id;
  const retailerId = choice === undefined ? primaryId : (choice ?? undefined);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    const result = perm.granted
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    const a = result.assets[0];
    setPhoto({ uri: a.uri, name: a.fileName ?? 'installation.jpg', mimeType: a.mimeType ?? 'image/jpeg', file: a.file });
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const photoKey = photo ? await uploadFile(photo, 'scan-photo') : undefined;
      const scan = await call(
        api.POST('/api/v1/app/scans', {
          body: { code, retailerId, invoiceNumber: invoiceNumber.trim() || undefined, siteLocation: site.trim() || undefined, photoKey },
        }),
      );
      void refreshAll();
      onDone(scan);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const status =
    resolved.status === 'Claimed'
      ? { label: 'Already claimed', tone: 'error' as const, text: 'This label has already been credited to an installation and cannot be scanned again.' }
      : resolved.status === 'Void'
        ? { label: 'Label voided', tone: 'error' as const, text: 'Levik withdrew this label. Contact your dealer or the trade helpline.' }
        : resolved.status === 'Unknown' || resolved.signatureValid === false
          ? { label: 'Not a genuine label', tone: 'error' as const, text: 'This code was not issued by Levik. Do not install suspected counterfeit products.' }
          : null;

  return (
    <Card style={styles.gap}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <View style={[styles.statusDot, { backgroundColor: genuine ? colors.emerald : colors.error }]} />
          <Text variant="labelSm" color={genuine ? colors.emeraldDeep : colors.error}>
            {genuine ? (resolved.signatureValid ? 'Hologram verified' : 'Serial recognised') : status?.label}
          </Text>
        </View>
        <Text variant="bodySm" color={colors.muted}>
          {resolved.serial}
        </Text>
      </View>

      {resolved.productName ? (
        <View style={styles.product}>
          <View>
            <ProductThumb imageUrl={resolved.imageUrl} size={96} label={resolved.productName} />
            {genuine ? (
              <View style={styles.genuine}>
                <Text variant="labelSm" color={colors.white}>
                  Genuine
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.flex}>
            <Text variant="labelSm" color={colors.slate}>
              Model {resolved.modelCode}
            </Text>
            <Text variant="headlineSm" color={colors.inkStrong} numberOfLines={2}>
              {resolved.productName}
            </Text>
          </View>
        </View>
      ) : null}

      {status ? (
        <View style={styles.error}>
          <Icon name="gpp_bad" color={colors.error} />
          <Text variant="body" color={colors.error} style={styles.flex}>
            {status.text}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.allocation}>
            <View style={styles.allocIcon}>
              <Icon name="stars" color={colors.goldInk} />
            </View>
            <View style={styles.flex}>
              <Text variant="labelSm" color={colors.slate}>
                Estimated allocation
              </Text>
              <Text variant="headlineXl" color={colors.inkStrong}>
                +{formatNumber(resolved.scanPoints ?? 0)}{' '}
                <Text variant="labelMd" color={colors.goldInk}>
                  Reward points
                </Text>
              </Text>
            </View>
            <Badge label="Provisional" tone="gold" uppercase={false} />
          </View>

          <Text variant="labelLg" color={colors.inkStrong}>
            Proof of sale
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Choose the dealer you bought from. Scans with a dealer and invoice number are verified faster.
          </Text>
          <DealerPicker value={retailerId} primaryId={primaryId} onChange={(id) => setChoice(id ?? null)} />
          <Field label="Invoice number (optional)" value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="SSS/25-26/0431" autoCapitalize="characters" />
          <Field label="Installation site (optional)" value={site} onChangeText={setSite} placeholder="Raja Park, Jaipur" />
          <Pressable accessibilityRole="button" onPress={() => void takePhoto()} style={styles.photo}>
            {photo ? <Image source={{ uri: photo.uri }} style={styles.photoPreview} contentFit="cover" /> : <Icon name="photo_camera" color={colors.navy} />}
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.navy}>
                {photo ? 'Installation photo added' : 'Add installation photo'}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Optional · helps the reviewer approve faster
              </Text>
            </View>
            {photo ? <Icon name="check_circle" color={colors.emerald} /> : null}
          </Pressable>
          {error ? (
            <View style={styles.error}>
              <Icon name="error_outline" color={colors.error} />
              <Text variant="body" color={colors.error} style={styles.flex}>
                {error}
              </Text>
            </View>
          ) : null}
          <Button title="Submit for Verification" icon="verified" variant="gold" onPress={() => void submit()} loading={busy} />
        </>
      )}
      <Button title="Scan Another Carton" icon="qr_code_scanner" variant="soft" onPress={onAgain} disabled={busy} />
    </Card>
  );
}

function Submitted({ scan, onAgain }: { scan: SubmittedScan; onAgain: () => void }) {
  return (
    <Card style={[styles.gap, styles.success]}>
      <View style={styles.successIcon}>
        <Icon name="task_alt" size={36} color={colors.emeraldDeep} />
      </View>
      <Text variant="headlineMd" color={colors.inkStrong} style={styles.center}>
        {scan.awaitingRetailer ? `Sent to ${scan.retailerName} to confirm` : 'Submitted for verification'}
      </Text>
      <Text variant="body" color={colors.muted} style={styles.center}>
        {scan.awaitingRetailer
          ? `${scan.productName} (${scan.id}). +${formatNumber(scan.points)} pts are credited as soon as ${scan.retailerName} confirms they sold it to you.`
          : `${scan.productName} (${scan.id}). +${formatNumber(scan.points)} pts will be credited once the Levik team approves the scan.`}
      </Text>
      <Button title="Scan Another Carton" icon="qr_code_scanner" onPress={onAgain} />
    </Card>
  );
}

const CORNER = 36;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.surface },
  scroll: { paddingBottom: space.xxxl },
  viewport: { height: 520, backgroundColor: colors.navy, overflow: 'hidden', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.lg },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', backgroundColor: 'rgba(11,30,61,0.35)' },
  controls: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg },
  controlPill: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.14)' },
  control: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 240, pointerEvents: 'none' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.goldLight },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  laser: { position: 'absolute', top: '50%', left: 12, right: 12, height: 2, backgroundColor: colors.goldLight, opacity: 0.8 },
  permission: { alignItems: 'center', gap: space.md, paddingHorizontal: space.xl },
  hint: { marginHorizontal: space.xl, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.full, backgroundColor: 'rgba(11,30,61,0.7)' },
  manualToggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, height: 48, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.14)' },
  sheetFlat: { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  sheet: { padding: space.lg, gap: space.lg, marginTop: -space.lg, borderTopLeftRadius: radius.hero, borderTopRightRadius: radius.hero, backgroundColor: colors.background },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  product: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  genuine: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(11,30,61,0.85)' },
  allocation: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceLow },
  allocIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  photo: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
  photoPreview: { width: 48, height: 48, borderRadius: radius.md },
  error: { flexDirection: 'row', gap: 8, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.errorWash },
  tamper: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: '#FCE8EA' },
  success: { alignItems: 'center' },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.emeraldWash, alignItems: 'center', justifyContent: 'center' },
});
