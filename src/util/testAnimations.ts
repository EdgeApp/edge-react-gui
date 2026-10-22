import { Platform, Settings } from 'react-native'

export type TestAnimationsMode = 'off' | 'fast'

/**
 * Test-mode animation switch for automated UI runs, read from the
 * `EdgeTestAnimations` user default (the `-EdgeTestAnimations off|fast`
 * launch argument, or a value the test harness wrote to the simulator).
 * Debug builds on iOS only; always null elsewhere.
 */
export const getTestAnimationsMode = (): TestAnimationsMode | null => {
  if (!__DEV__ || Platform.OS !== 'ios') return null
  const mode: unknown = Settings.get('EdgeTestAnimations')
  return mode === 'off' || mode === 'fast' ? mode : null
}
