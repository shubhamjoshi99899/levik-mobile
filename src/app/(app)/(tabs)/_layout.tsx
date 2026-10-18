import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { StyleSheet } from 'react-native';
import { useSession } from '@/api/session';
import { TabDock } from '@/components/tab-dock';

/**
 * Headless expo-router tabs (TabList is hidden; the custom dock renders the triggers) so the centre
 * scan action can sit between the tabs. Home and History render the plumber or retailer variant by role;
 * Profile is a stack screen opened from the avatar in the top bar.
 */
export default function TabsLayout() {
  const session = useSession();
  const role = session.status === 'signedIn' && session.user.role === 'retailer' ? 'retailer' : 'plumber';
  return (
    <Tabs style={styles.fill}>
      <TabSlot style={styles.fill} />
      <TabList style={styles.hidden}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="rewards" href="/rewards" />
        <TabTrigger name="history" href="/history" />
      </TabList>
      <TabDock role={role} />
    </Tabs>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 }, hidden: { display: 'none' } });
