import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

export type HapticTriggerType = 'impactLight' | 'impactMedium' | 'impactHeavy'

export const triggerHaptic = (type: HapticTriggerType) => {
  ReactNativeHapticFeedback.trigger(type)
}
