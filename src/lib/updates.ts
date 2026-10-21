import * as Updates from 'expo-updates';
import { useEffect } from 'react';

/**
 * Over-the-air updates for test builds. By default a new update is downloaded in the background and only used
 * on the launch after that, so testers saw changes one restart late. Instead, check once at startup and, when
 * an update is available, download it and reload into it straight away. No-op in development and Expo Go.
 */
export function useApplyUpdateOnLaunch() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    void (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // Offline or the update server is unreachable: keep running the current version.
      }
    })();
  }, []);
}

/** "v1.0.0 · update 8fde1054" (or "embedded" for the build's own bundle), shown on the profile screens. */
export function appVersionLabel(version: string): string {
  const update = Updates.isEnabled && !Updates.isEmbeddedLaunch && Updates.updateId ? `update ${Updates.updateId.slice(0, 8)}` : 'embedded';
  return `v${version} · ${update}`;
}
