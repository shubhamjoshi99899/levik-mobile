import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api, api, call, refreshAll, uploadFile, type PickedFile } from '@/api/client';
import { errorMessage } from '@/api/errors';
import type { components } from '@/api/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useDebounced } from '@/lib/use-debounced';
import { pickDocument, takePhoto } from '@/lib/pick-file';
import { colors, gradients, radius, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/api/session';
import { ProductThumb } from '../shared/parts';

type Product = components['schemas']['AppProductResponseDto'];
interface Line {
  product: Product;
  quantity: string;
  unitPrice: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Upload a GST invoice: document (photo/PDF) + details + line items, then submit for verification.
 * The incentive projection is calculated by the API on the invoice screen after submission.
 */
export function InvoiceUploadScreen() {
  const router = useRouter();
  const session = useSession();
  const shop = session.status === 'signedIn' ? session.user.name : undefined;
  const [doc, setDoc] = useState<PickedFile | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [buyer, setBuyer] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate) && !Number.isNaN(Date.parse(invoiceDate));
  const ready = invoiceNumber.trim().length >= 2 && validDate && buyer.trim().length >= 2 && lines.length > 0 && lines.every((l) => Number(l.quantity) > 0) && confirmed;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const documentKey = doc ? await uploadFile(doc, 'invoice-document') : undefined;
      const invoice = await call(
        api.POST('/api/v1/app/invoices', {
          body: {
            invoiceNumber: invoiceNumber.trim(),
            invoiceDate: new Date(`${invoiceDate}T12:00:00+05:30`).toISOString(),
            buyerName: buyer.trim(),
            documentKey,
            lines: lines.map((l) => ({ productId: l.product.id, quantity: Number(l.quantity), unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined })),
          },
        }),
      );
      void refreshAll();
      router.replace({ pathname: '/invoice/[id]', params: { id: invoice.id } });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<AppHeader back eyebrow="Bank encrypted" title="Invoice Upload" />}
      footer={
        <View style={styles.footer}>
          <Button title="Submit Invoice for Verification" trailingIcon="arrow_forward" onPress={() => void submit()} loading={busy} disabled={!ready} />
        </View>
      }
    >
      <View style={styles.row}>
        <View style={styles.liveDot} />
        <Text variant="labelMd" color={colors.inkStrong}>
          {shop ?? 'Your shop'}
        </Text>
      </View>

      <LinearGradient colors={gradients.navy} style={styles.hub}>
        <View style={styles.rowBetween}>
          <Badge label="Tax & rebate hub" tone="soft" icon="verified" />
        </View>
        <Text variant="headlineMd" color={colors.white}>
          Upload Wholesale Tax Invoice
        </Text>
        <Text variant="body" color={colors.onNavyMuted}>
          Earn retailer incentive points on eligible Levik products once the Levik team verifies your invoice.
        </Text>
      </LinearGradient>

      <Card style={styles.upload}>
        {doc ? (
          doc.mimeType.startsWith('image/') ? (
            <Image source={{ uri: doc.uri }} style={styles.preview} contentFit="cover" />
          ) : (
            <View style={styles.pdf}>
              <Icon name="picture_as_pdf" size={40} color={colors.error} />
              <Text variant="labelLg" color={colors.inkStrong}>
                {doc.name}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.scanIcon}>
            <Icon name="document_scanner" size={40} color={colors.navy} />
          </View>
        )}
        <View style={styles.uploadActions}>
          <Button title={doc ? 'Retake photo' : 'Take photo'} icon="photo_camera" size="md" style={styles.flex} onPress={() => void takePhoto().then((f) => f && setDoc(f))} />
          <Button title="Upload file" icon="upload_file" variant="outline" size="md" style={styles.flex} onPress={() => void pickDocument().then((f) => f && setDoc(f))} />
        </View>
        <Text variant="bodySm" color={colors.muted} style={styles.center}>
          Paper invoices, PDF or JPG (max 10 MB)
        </Text>
        <View style={styles.tags}>
          {['GST tax invoices', 'Delivery challans', 'E-way bills'].map((t) => (
            <Badge key={t} label={t} tone="neutral" uppercase={false} />
          ))}
        </View>
      </Card>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Badge label="Invoice details" tone="emerald" icon="edit_note" uppercase={false} />
          <Text variant="labelMd" color={colors.slate}>
            Review & confirm
          </Text>
        </View>
        <Field label="Buyer / bill to" value={buyer} onChangeText={setBuyer} placeholder="Raja Park Duplex (via Ramesh Kumar)" />
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field label="Invoice number" value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="INV-2026-9042" autoCapitalize="characters" />
          </View>
          <View style={styles.flex}>
            <Field label="Invoice date" value={invoiceDate} onChangeText={setInvoiceDate} placeholder="YYYY-MM-DD" error={invoiceDate && !validDate ? 'Use YYYY-MM-DD' : undefined} suffix={<Icon name="calendar_today" size={18} color={colors.slate} />} />
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Billed items ({lines.length})
          </Text>
          <Button title="Add item" icon="add" size="sm" variant="soft" onPress={() => setPickerOpen(true)} />
        </View>
        {lines.length === 0 ? (
          <Text variant="bodySm" color={colors.muted}>
            Add each Levik product on the invoice. Unit price defaults to the product MRP if left empty.
          </Text>
        ) : null}
        {lines.map((l, i) => (
          <View key={l.product.id} style={styles.line}>
            <ProductThumb imageUrl={l.product.imageUrl} size={48} />
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
                {l.product.name}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Model {l.product.modelCode}
              </Text>
              <View style={styles.lineInputs}>
                <View style={styles.qty}>
                  <Field value={l.quantity} onChangeText={(t) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: t.replace(/\D/g, '').slice(0, 4) } : x)))} keyboardType="number-pad" placeholder="Qty" accessibilityLabel="Quantity" />
                </View>
                <View style={styles.flex}>
                  <Field
                    value={l.unitPrice}
                    onChangeText={(t) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, unitPrice: t.replace(/[^\d]/g, '').slice(0, 7) } : x)))}
                    keyboardType="number-pad"
                    placeholder="MRP"
                    accessibilityLabel="Unit price before GST"
                    prefix={<Text variant="labelLg" color={colors.slate}>₹</Text>}
                  />
                </View>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${l.product.name}`} onPress={() => setLines((ls) => ls.filter((_, j) => j !== i))} hitSlop={8}>
              <Icon name="delete_outline" color={colors.error} />
            </Pressable>
          </View>
        ))}
      </Card>

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} onPress={() => setConfirmed((c) => !c)} style={styles.confirm}>
        <View style={[styles.check, confirmed && styles.checkOn]}>{confirmed ? <Icon name="check" size={16} color={colors.white} /> : null}</View>
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Genuine B2B procurement confirmation
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            I confirm this invoice is a genuine sale of Levik products and has not been uploaded before.
          </Text>
        </View>
      </Pressable>

      {error ? (
        <View style={styles.error}>
          <Icon name="error_outline" color={colors.error} />
          <Text variant="body" color={colors.error} style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : null}

      <ProductPicker
        open={pickerOpen}
        exclude={lines.map((l) => l.product.id)}
        onClose={() => setPickerOpen(false)}
        onPick={(product) => {
          setLines((ls) => [...ls, { product, quantity: '1', unitPrice: '' }]);
          setPickerOpen(false);
        }}
      />
    </Screen>
  );
}

function ProductPicker({ open, exclude, onClose, onPick }: { open: boolean; exclude: string[]; onClose: () => void; onPick: (p: Product) => void }) {
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 250);
  const { data } = $api.useQuery('get', '/api/v1/app/products', { params: { query: { pageSize: 20, search: term || undefined } } }, { enabled: open });
  return (
    <Sheet open={open} onClose={onClose} title="Add product">
      <Field value={search} onChangeText={setSearch} placeholder="Search model, name or category" prefix={<Icon name="search" size={20} color={colors.slate} />} autoFocus />
      <View style={styles.pickerList}>
        {(data?.items ?? [])
          .filter((p) => !exclude.includes(p.id))
          .slice(0, 6)
          .map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => onPick(p)} style={styles.pickRow}>
              <ProductThumb imageUrl={p.imageUrl} size={44} />
              <View style={styles.flex}>
                <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text variant="bodySm" color={colors.muted}>
                  {p.category} · Model {p.modelCode}
                </Text>
              </View>
              <Icon name="add_circle" color={colors.navy} />
            </Pressable>
          ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald },
  hub: { gap: space.sm, padding: space.xl, borderRadius: radius.hero },
  upload: { alignItems: 'center', gap: space.md },
  scanIcon: { width: 88, height: 88, borderRadius: radius.lg, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed' },
  preview: { width: '100%', height: 200, borderRadius: radius.lg },
  pdf: { alignItems: 'center', gap: space.sm, padding: space.lg },
  uploadActions: { flexDirection: 'row', gap: space.md, alignSelf: 'stretch' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  line: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  lineInputs: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  qty: { width: 84 },
  confirm: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceMid },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  error: { flexDirection: 'row', gap: 8, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.errorWash },
  footer: { paddingBottom: space.sm },
  pickerList: { gap: space.sm },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
});
