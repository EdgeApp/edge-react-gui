import * as React from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'

export const useLayoutOnce = (): [LayoutRectangle | undefined, (e: LayoutChangeEvent) => void] => {
  const [layout, setLayout] = React.useState<LayoutRectangle | undefined>(undefined)
  const handleLayout = (event: LayoutChangeEvent) => {
    if (layout != null) return
    setLayout(event.nativeEvent.layout)
  }
  return [layout, handleLayout]
}
