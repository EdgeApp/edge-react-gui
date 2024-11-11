import React, { ComponentType, ReactNode, useEffect, useRef, useState } from 'react'
import { GestureResponderEvent, TouchableHighlightProps, TouchableOpacityProps, TouchableWithoutFeedbackProps } from 'react-native'

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

export function withExtendedTouchable<T extends TouchableOpacityProps | TouchableWithoutFeedbackProps | TouchableHighlightProps>(
  WrappedComponent: ComponentType<PropsWithOptionalChildren<T>>
): React.FC<PropsWithOptionalChildren<T> & ExtendedProps> {
  const ExtendedTouchable: React.FC<PropsWithOptionalChildren<T> & ExtendedProps> = ({
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

    useEffect(() => {
      return () => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    const runPress = (event: GestureResponderEvent, pressFn?: PressFn) => {
      if (pressFn == null) return
      if (isDebouncing || isAwaiting) return

      // Set debounce state before we even know if onPress is async or not to
      // guarantee we cannot call onPress twice in quick succession.
      if (debounce) setIsDebouncing(true)

      try {
        const result = pressFn(event)
        // Async onPress. Always show busy form until promise resolves
        if (typeof result?.then === 'function') {
          setIsAwaiting(true)
          result.catch(e => showError(e)).finally(() => setIsAwaiting(false))
        }

        // Also layer on debounce state toggling if enabled
        if (debounce) {
          timeoutRef.current = setTimeout(() => setIsDebouncing(false), DEBOUNCE_DELAY)
        }
      } catch (err) {
        showError(err)

        // Always reset the busy state no matter what
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
      <WrappedComponent disabled={isDebouncing || isAwaiting} onPress={handlePress} onLongPress={handleLongPress} {...(restProps as any)}>
        {isAwaiting && awaitChild != null ? awaitChild : children}
      </WrappedComponent>
    )
  }

  return ExtendedTouchable
}
