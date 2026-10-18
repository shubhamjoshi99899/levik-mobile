import { StyleSheet, View } from 'react-native';
import { radius, space } from '@/theme/tokens';
import { Bone, BoneCard, BoneHero, SkeletonGroup } from './ui/skeleton';

/**
 * Page-shaped loading placeholders. Each mirrors the card structure of its screen so the layout
 * doesn't jump when data arrives. Render them inside the page's own header/Screen.
 */

const row = { flexDirection: 'row', alignItems: 'center', gap: space.md } as const;

/** Icon tile + two text lines + trailing amount (activity, ledger, redemptions). */
export function RowBone({ trailing = true }: { trailing?: boolean }) {
  return (
    <View style={row}>
      <Bone width={44} height={44} radius={radius.md} />
      <View style={styles.flexGap}>
        <Bone width="70%" height={13} />
        <Bone width="45%" height={10} />
      </View>
      {trailing ? <Bone width={56} height={16} /> : null}
    </View>
  );
}

/** Stack of list cards (passbook entries, redemptions, invoices). */
export function ListCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <BoneCard key={i}>
          <RowBone />
          <View style={styles.between}>
            <Bone width={90} height={10} />
            <Bone width={110} height={22} radius={radius.full} />
          </View>
        </BoneCard>
      ))}
    </>
  );
}

/** Navy balance plinth: label, big number, two stat lines, two buttons. */
function BalanceHeroBone({ buttons = 2 }: { buttons?: number }) {
  return (
    <BoneHero>
      <View style={styles.between}>
        <Bone dark width={110} height={10} />
        <Bone dark width={80} height={10} />
      </View>
      <Bone dark width={150} height={34} />
      <View style={[styles.innerDark, row]}>
        <View style={styles.flexGap}>
          <Bone dark width="70%" height={10} />
          <Bone dark width="50%" height={13} />
        </View>
        <View style={styles.flexGap}>
          <Bone dark width="70%" height={10} />
          <Bone dark width="50%" height={13} />
        </View>
      </View>
      {buttons ? (
        <View style={row}>
          {Array.from({ length: buttons }).map((_, i) => (
            <Bone key={i} dark height={48} radius={radius.card} style={styles.flex} />
          ))}
        </View>
      ) : null}
    </BoneHero>
  );
}

function QuickActionsBone() {
  return (
    <View style={row}>
      {[0, 1, 2, 3].map((i) => (
        <BoneCard key={i} style={styles.quick}>
          <Bone width={52} height={52} radius={26} />
          <Bone width="70%" height={10} />
        </BoneCard>
      ))}
    </View>
  );
}

function ProgressCardBone() {
  return (
    <BoneCard>
      <View style={row}>
        <Bone width={52} height={52} radius={radius.lg} />
        <View style={styles.flexGap}>
          <Bone width="40%" height={9} />
          <Bone width="75%" height={15} />
          <Bone width="50%" height={10} />
        </View>
      </View>
      <Bone height={6} radius={radius.full} />
      <View style={styles.between}>
        <Bone width={60} height={10} />
        <Bone width={90} height={10} />
        <Bone width={60} height={10} />
      </View>
    </BoneCard>
  );
}

export function PlumberHomeSkeleton() {
  return (
    <SkeletonGroup label="Loading your dashboard">
      <View style={styles.gapSm}>
        <Bone width="65%" height={26} />
        <View style={styles.between}>
          <Bone width="50%" height={12} />
          <Bone width={110} height={22} radius={radius.full} />
        </View>
      </View>
      <BalanceHeroBone />
      <ProgressCardBone />
      <QuickActionsBone />
      <BoneCard>
        <Bone width="55%" height={16} />
        <Bone height={36} radius={radius.lg} />
        <RowBone />
        <RowBone />
        <RowBone />
      </BoneCard>
    </SkeletonGroup>
  );
}

export function RetailerHomeSkeleton() {
  return (
    <SkeletonGroup label="Loading your dashboard">
      <View style={styles.between}>
        <Bone width={130} height={10} />
        <Bone width={110} height={22} radius={radius.full} />
      </View>
      <Bone width="80%" height={26} />
      <View style={row}>
        <Bone width={160} height={22} radius={radius.full} />
        <Bone width={100} height={22} radius={radius.full} />
      </View>
      <BoneHero>
        <View style={styles.between}>
          <Bone dark width={120} height={10} />
          <Bone dark width={90} height={22} radius={radius.full} />
        </View>
        <Bone dark width="70%" height={30} />
        <Bone dark width="60%" height={10} />
        <Bone dark height={8} radius={radius.full} />
        <Bone dark height={56} radius={radius.lg} />
      </BoneHero>
      <QuickActionsBone />
      <Bone width="55%" height={16} />
      {[0, 1].map((r) => (
        <View key={r} style={row}>
          {[0, 1].map((c) => (
            <BoneCard key={c} style={styles.flex}>
              <Bone width="60%" height={10} />
              <Bone width="70%" height={22} />
              <Bone width="80%" height={10} />
            </BoneCard>
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}

export function RewardsSkeleton() {
  return (
    <SkeletonGroup label="Loading rewards">
      <BoneHero style={styles.heroRow}>
        <View style={styles.flexGap}>
          <Bone dark width={120} height={10} />
          <Bone dark width={130} height={30} />
          <Bone dark width="80%" height={10} />
        </View>
        <View style={styles.rightCol}>
          <Bone dark width={100} height={24} radius={radius.full} />
          <Bone dark width={80} height={10} />
        </View>
      </BoneHero>
      <ChipsBone />
      <BoneCard>
        <View style={styles.between}>
          <Bone width={140} height={22} radius={radius.full} />
          <Bone width={70} height={22} radius={radius.full} />
        </View>
        <View style={row}>
          <Bone width={88} height={88} radius={radius.lg} />
          <View style={styles.flexGap}>
            <Bone width="45%" height={9} />
            <Bone width="80%" height={15} />
            <Bone width="40%" height={20} />
          </View>
        </View>
        <Bone height={6} radius={radius.full} />
      </BoneCard>
      <Bone width="55%" height={18} />
      {[0, 1, 2].map((i) => (
        <BoneCard key={i}>
          <View style={row}>
            <Bone width={72} height={72} radius={radius.lg} />
            <View style={styles.flexGap}>
              <Bone width="40%" height={9} />
              <Bone width="75%" height={15} />
              <Bone width="35%" height={20} />
            </View>
          </View>
          <View style={styles.between}>
            <Bone width="40%" height={10} />
            <Bone width={120} height={44} radius={radius.card} />
          </View>
        </BoneCard>
      ))}
    </SkeletonGroup>
  );
}

function ChipsBone() {
  return (
    <View style={row}>
      {[96, 130, 110].map((w, i) => (
        <Bone key={i} width={w} height={36} radius={radius.full} />
      ))}
    </View>
  );
}

export function PassbookSkeleton() {
  return (
    <SkeletonGroup label="Loading passbook">
      <Bone height={44} radius={radius.lg} />
      <BalanceHeroBone />
      <View style={styles.between}>
        <Bone width="45%" height={18} />
        <Bone width={70} height={12} />
      </View>
      <ChipsBone />
      <ListCardsSkeleton count={3} />
    </SkeletonGroup>
  );
}

export function ProfileSkeleton() {
  return (
    <SkeletonGroup label="Loading profile">
      <BoneCard>
        <View style={row}>
          <Bone width={72} height={72} radius={36} />
          <View style={styles.flexGap}>
            <Bone width="60%" height={20} radius={radius.full} />
            <Bone width="70%" height={18} />
            <Bone width="85%" height={10} />
          </View>
        </View>
        <Bone height={52} radius={radius.lg} />
      </BoneCard>
      <BalanceHeroBone />
      <BoneCard>
        <Bone width="55%" height={16} />
        <Bone height={60} radius={radius.lg} />
        <Bone height={60} radius={radius.lg} />
      </BoneCard>
      <BoneCard>
        {[0, 1, 2, 3].map((i) => (
          <RowBone key={i} trailing={false} />
        ))}
      </BoneCard>
    </SkeletonGroup>
  );
}

/** Two-column product tiles (Explore → Products). */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.grid} accessible accessibilityLabel="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.tile}>
          <Bone height={120} radius={0} />
          <View style={styles.tileBody}>
            <Bone width="45%" height={9} />
            <Bone width="85%" height={13} />
            <Bone width="60%" height={13} />
            <Bone width={110} height={24} radius={radius.full} />
            <Bone width="70%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Dealer cards with contact actions (Explore → Dealers, product page). */
export function DealerCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <BoneCard key={i}>
          <View style={row}>
            <Bone width={44} height={44} radius={radius.md} />
            <View style={styles.flexGap}>
              <Bone width="65%" height={13} />
              <Bone width="50%" height={10} />
            </View>
            <Bone width={70} height={22} radius={radius.full} />
          </View>
          <Bone width="80%" height={10} />
          <View style={row}>
            <Bone height={36} radius={radius.card} style={styles.flex} />
            <Bone height={36} radius={radius.card} style={styles.flex} />
            <Bone height={36} radius={radius.card} style={styles.flex} />
          </View>
        </BoneCard>
      ))}
    </>
  );
}

export function ProductDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading product">
      <Bone height={240} radius={radius.hero} />
      <BoneCard>
        <View style={styles.between}>
          <Bone width={70} height={10} />
          <Bone width={110} height={10} />
        </View>
        <Bone width={170} height={36} radius={radius.full} />
        <Bone height={52} radius={radius.lg} />
        <Bone height={48} radius={radius.card} />
      </BoneCard>
      <BoneCard>
        <Bone width="40%" height={13} />
        <Bone width="95%" height={10} />
        <Bone width="80%" height={10} />
        <Bone width="60%" height={10} />
      </BoneCard>
      <Bone width="60%" height={18} />
      <DealerCardsSkeleton count={2} />
    </SkeletonGroup>
  );
}

export function DealerDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading dealer">
      <BoneHero>
        <View style={styles.between}>
          <Bone dark width={80} height={22} radius={radius.full} />
          <Bone dark width={70} height={22} radius={radius.full} />
        </View>
        <Bone dark width="70%" height={22} />
        <Bone dark width="85%" height={10} />
        <Bone dark width="45%" height={10} />
        <View style={[styles.innerDark, row]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.flexGap}>
              <Bone dark width="50%" height={18} />
              <Bone dark width="80%" height={9} />
            </View>
          ))}
        </View>
        <View style={row}>
          <Bone dark height={48} radius={radius.card} style={styles.flex} />
          <Bone dark height={48} radius={radius.card} style={styles.flex} />
        </View>
      </BoneHero>
      <Bone width="45%" height={18} />
      {[0, 1, 2].map((i) => (
        <BoneCard key={i} style={row}>
          <Bone width={72} height={72} radius={radius.lg} />
          <View style={styles.flexGap}>
            <Bone width="55%" height={9} />
            <Bone width="80%" height={13} />
            <View style={row}>
              <Bone width={100} height={24} radius={radius.full} />
              <Bone width={80} height={22} radius={radius.full} />
            </View>
          </View>
        </BoneCard>
      ))}
    </SkeletonGroup>
  );
}

export function LedgerSkeleton() {
  return (
    <SkeletonGroup label="Loading ledger">
      <BoneCard>
        <View style={row}>
          <Bone width={48} height={48} radius={radius.md} />
          <View style={styles.flexGap}>
            <Bone width="65%" height={15} />
            <Bone width="50%" height={10} />
          </View>
          <Bone width={70} height={22} radius={radius.full} />
        </View>
        <Bone height={44} radius={radius.lg} />
      </BoneCard>
      <BalanceHeroBone buttons={0} />
      <ProgressCardBone />
      <ChipsBone />
      <ListCardsSkeleton count={3} />
    </SkeletonGroup>
  );
}

export function InvoiceDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading invoice">
      <BoneCard>
        <View style={styles.between}>
          <Bone width={90} height={22} radius={radius.full} />
          <Bone width={70} height={10} />
        </View>
        <Bone width="55%" height={30} />
        <Bone width="80%" height={10} />
      </BoneCard>
      <BoneCard>
        <Bone width="40%" height={13} />
        <RowBone trailing />
        <Bone height={96} radius={radius.lg} />
      </BoneCard>
      <Bone height={110} radius={radius.card} />
    </SkeletonGroup>
  );
}

export function CashoutSkeleton() {
  return (
    <SkeletonGroup label="Loading balance">
      <Bone height={48} radius={radius.lg} />
      <BalanceHeroBone buttons={0} />
      <BoneCard>
        <Bone width="55%" height={16} />
        <View style={row}>
          {[0, 1, 2].map((i) => (
            <Bone key={i} height={56} radius={radius.lg} style={styles.flex} />
          ))}
        </View>
        <Bone height={52} radius={radius.lg} />
      </BoneCard>
      <Bone height={96} radius={radius.card} />
      <Bone height={96} radius={radius.card} />
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGap: { flex: 1, gap: 8 },
  gapSm: { gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  innerDark: { padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroRow: { flexDirection: 'row', gap: space.md },
  rightCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
  quick: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { width: '47.8%', flexGrow: 1, maxWidth: '48.5%', borderRadius: radius.card, backgroundColor: '#FFFFFF', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(15, 41, 82, 0.07)' },
  tileBody: { padding: space.md, gap: 8 },
});
