import React, { useEffect, useState } from 'react'
import { LayoutChangeEvent, StyleSheet } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { BlurView } from 'rn-id-blurview'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDrawerOpenRatio } from '../../state/SceneDrawerState'
import { styled } from '../hoc/styled'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { Space } from '../layout/Space'
import { useTheme } from '../services/ThemeContext'
import { SimpleTextInput, SimpleTextInputRef } from './SimpleTextInput'

interface WalletListSearchProps {
  isSearching: boolean
  searchText: string

  onChangeText: (value: string) => void
  onDoneSearching: () => void
  onStartSearching: () => void
}

export const WalletListSearch = (props: WalletListSearchProps) => {
  const { isSearching, searchText, onChangeText, onDoneSearching, onStartSearching } = props
  const theme = useTheme()

  const textInputRef = React.useRef<SimpleTextInputRef>(null)

  const { drawerOpenRatio, setKeepOpen } = useDrawerOpenRatio()
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)

  const inputScale = useDerivedValue(() => drawerOpenRatio.value)

  const handleLayout = useHandler((event: LayoutChangeEvent) => {
    if (containerHeight != null) return
    setContainerHeight(event.nativeEvent.layout.height)
  })

  const handleSearchChangeText = useHandler((text: string) => {
    onChangeText(text)
  })

  const handleSearchBlur = useHandler(() => {
    if (searchText === '') {
      onDoneSearching()
    }
  })

  const handleSearchClear = useHandler(() => {
    if (!textInputRef.current?.isFocused()) {
      onDoneSearching()
    }
  })

  const handleSearchFocus = useHandler(() => {
    onStartSearching()
  })

  useEffect(() => {
    if (setKeepOpen != null) setKeepOpen(isSearching)
    if (isSearching && textInputRef.current) {
      textInputRef.current.focus()
    }
    if (!isSearching && textInputRef.current) {
      textInputRef.current.blur()
    }
  }, [isSearching, setKeepOpen])

  return (
    <>
      <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} overlayColor="#00000000" />
      <ContainerAnimatedView containerHeight={containerHeight} drawerOpenRatio={drawerOpenRatio} onLayout={handleLayout}>
        <Space expand horizontal={1} vertical={0.5}>
          <SimpleTextInput
            returnKeyType="search"
            placeholder={lstrings.wallet_list_wallet_search}
            onChangeText={handleSearchChangeText}
            value={searchText}
            onBlur={handleSearchBlur}
            onClear={handleSearchClear}
            onFocus={handleSearchFocus}
            ref={textInputRef}
            iconComponent={SearchIconAnimated}
            scale={inputScale}
          />
        </Space>
      </ContainerAnimatedView>
    </>
  )
}

const ContainerAnimatedView = styled(Animated.View)<{
  containerHeight?: number
  drawerOpenRatio: SharedValue<number>
}>(() => ({ containerHeight, drawerOpenRatio }) => [
  {
    overflow: 'hidden'
  },
  useAnimatedStyle(() => {
    if (containerHeight == null) return {}
    return {
      height: containerHeight * drawerOpenRatio.value
    }
  })
])
