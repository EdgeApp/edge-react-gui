import { NavigationContext } from '@react-navigation/native'
import React, {
  type ComponentType,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import type {
  GestureResponderEvent,
  TouchableHighlightProps,
  TouchableOpacityProps,
  TouchableWithoutFeedbackProps
} from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { showError } from '../services/AirshipInstance'

type PressFn = (event: GestureResponderEvent) => void | Promise<void>

interface ExtendedProps {
  onPress?: PressFn
  onLongPress?: PressFn
  awaitChild?: ReactNode // What to render during async await, if different from children. This does not get rendered while debounce is in effect, only while awaiting the onPress.
  debounce?: boolean // Enforce a strict 500ms debounce delay for synchronous press handlers.
}

type PropsWithOptionalChildren<P = unknown> = P & { children?: ReactNode }

const DEBOUNCE_DELAY = 500

export function withExtendedTouchable<
  T extends
    | TouchableOpacityProps
    | TouchableWithoutFeedbackProps
    | TouchableHighlightProps
>(
  WrappedComponent: ComponentType<PropsWithOptionalChildren<T>>
): React.FC<PropsWithOptionalChildren<T> & ExtendedProps> {
  const ExtendedTouchable: React.FC<
    PropsWithOptionalChildren<T> & ExtendedProps
  > = ({
    children,
    onPress,
    onLongPress,
    awaitChild,
    debounce = false,
    ...restProps
  }) => {
    const [isDebouncing, setIsDebouncing] = useState<boolean>(false)
    const [isAwaiting, setIsAwaiting] = useState<boolean>(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const navigation = useContext(NavigationContext)

    // The press guards read these refs instead of the state above, since state
    // stays stale until the next render and a second tap can land before that:
    const isDebouncingRef = useRef<boolean>(false)
    const isAwaitingRef = useRef<boolean>(false)

    useEffect(() => {
      return () => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    const runPress = (
      event: GestureResponderEvent,
      pressFn?: PressFn
    ): void => {
      if (pressFn == null) return
      if (isDebouncingRef.current || isAwaitingRef.current) return

      // A press that navigated away leaves this scene unfocused but still on
      // screen until the transition ends, so later taps must not stack scenes:
      if (navigation != null && !navigation.isFocused()) return

      // Set debounce state before we even know if onPress is async or not to
      // guarantee we cannot call onPress twice in quick succession.
      if (debounce) {
        isDebouncingRef.current = true
        setIsDebouncing(true)
      }

      try {
        const result = pressFn(event)
        // Async onPress. Always show busy form until promise resolves
        if (typeof result?.then === 'function') {
          isAwaitingRef.current = true
          setIsAwaiting(true)
          result
            .catch((e: unknown) => {
              showError(e)
            })
            .finally(() => {
              isAwaitingRef.current = false
              setIsAwaiting(false)
            })
        }

        // Also layer on debounce state toggling if enabled
        if (debounce) {
          timeoutRef.current = setTimeout(() => {
            isDebouncingRef.current = false
            setIsDebouncing(false)
          }, DEBOUNCE_DELAY)
        }
      } catch (err) {
        showError(err)

        // Always reset the busy state no matter what
        isDebouncingRef.current = false
        isAwaitingRef.current = false
        setIsDebouncing(false)
        setIsAwaiting(false)
      }
    }

    const handlePress = useHandler((event: GestureResponderEvent) => {
      runPress(event, onPress)
    })

    const handleLongPress = useHandler((event: GestureResponderEvent) => {
      runPress(event, onLongPress)
    })

    // HACK: Can't get typescript to not complain when defining restProps as T
    return children == null ? null : (
      <WrappedComponent
        disabled={isDebouncing || isAwaiting}
        onPress={handlePress}
        onLongPress={handleLongPress}
        {...(restProps as any)}
      >
        {isAwaiting && awaitChild != null ? awaitChild : children}
      </WrappedComponent>
    )
  }

  return ExtendedTouchable
}
