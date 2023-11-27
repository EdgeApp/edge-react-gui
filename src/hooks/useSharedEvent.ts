import { SharedValue, useAnimatedReaction } from 'react-native-reanimated'

/**
 * Allows you to subscribe to a SharedValue event with a given handler function.
 *
 * @param sharedEvent SharedValue containing the event or undefined
 * @param handler An event handler to invoke when the event changes
 * @returns void
 */
export const useSharedEvent = <T>(sharedEvent: SharedValue<T> | undefined, handler: (event: T) => void) =>
  useAnimatedReaction(
    () => {
      'worklet'
      return sharedEvent?.value
    },
    (currentValue, previousValue) => {
      'worklet'
      if (currentValue != null && currentValue !== previousValue) {
        // runOnJS(handler)(currentValue)
        handler(currentValue)
      }
    },
    [sharedEvent, handler]
  )
