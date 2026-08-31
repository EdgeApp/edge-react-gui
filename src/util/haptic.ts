import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'

export type HapticTriggerType = 'impactLight' | 'impactMedium' | 'impactHeavy'

const styles: Record<HapticTriggerType, ImpactFeedbackStyle> = {
  impactLight: ImpactFeedbackStyle.Light,
  impactMedium: ImpactFeedbackStyle.Medium,
  impactHeavy: ImpactFeedbackStyle.Heavy
}

/**
 * Drop-in for react-native-haptic-feedback impact types.
 * login-ui still depends on that package, so it stays linked; GUI uses Expo.
 */
export const triggerHaptic = (type: HapticTriggerType): void => {
  impactAsync(styles[type]).catch(() => {})
}
