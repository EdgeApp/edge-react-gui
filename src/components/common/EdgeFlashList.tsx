import { FlashList, FlashListProps } from '@shopify/flash-list'
import * as React from 'react'

import { useSelector } from '../../types/reactRedux'
import { useTheme } from '../services/ThemeContext'

interface EdgeFlashListProps<T> extends FlashListProps<T> {
  ref?: React.Ref<FlashList<T>>
  keyExtractor?: ((item: T, index: number) => string) | undefined
}

/**
 * Wraps a FlashList with awareness of the notification view. Adds extra padding
 * if the notification view is visible.
 */
// export const EdgeFlashListInner = <T,>(props: FlashListProps<T>, ref?: React.Ref<any>) => {
//   const theme = useTheme()
//   const isNotificationViewActive = useSelector(state => state.isNotificationViewActive)

//   // Check if notification view is visible:
//   return <FlashList<T> ref={ref} contentContainerStyle={{ paddingBottom: isNotificationViewActive ? theme.rem(4.25) : 0 }} {...props} />
// }

// export const EdgeFlashList = React.forwardRef(EdgeFlashListInner)

function EdgeFlashListInner<T>({ ref, ...props }: EdgeFlashListProps<T>) {
  const theme = useTheme()
  const isNotificationViewActive = useSelector(state => state.isNotificationViewActive)

  // Check if notification view is visible:
  return <FlashList ref={ref} contentContainerStyle={{ paddingBottom: isNotificationViewActive ? theme.rem(4.25) : 0 }} {...props} />
}

export const EdgeFlashList = React.forwardRef(EdgeFlashListInner)

// /**
//  * Wraps a FlashList with awareness of the notification view. Adds extra padding
//  * if the notification view is visible.
//  */
// const EdgeFlashListInner = <T,>(props: FlashListProps<T>, ref: React.LegacyRef<FlashList<T>>) => {
//   const theme = useTheme()
//   const isNotificationViewActive = useSelector(state => state.isNotificationViewActive)

//   // Check if notification view is visible:
//   return <FlashList ref={ref} contentContainerStyle={{ paddingBottom: isNotificationViewActive ? theme.rem(4.25) : 0 }} {...props} />
// }

// export const EdgeFlashList = React.forwardRef(EdgeFlashListInner)
