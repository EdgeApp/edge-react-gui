import React, { useEffect } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDrawerOpenRatio } from '../../state/SceneDrawerState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { Space } from '../layout/Space'
import { SceneDrawerWrapper } from './SceneDrawerWrapper'
import { SimpleTextInput, SimpleTextInputRef } from './SimpleTextInput'

interface WalletListSearchProps {
  isSearching: boolean
  searchText: string
  sceneWrapperInfo: SceneWrapperInfo

  onChangeText: (value: string) => void
  onDoneSearching: () => void
  onStartSearching: () => void
}

export const WalletListSearch = (props: WalletListSearchProps) => {
  const { isSearching, searchText, sceneWrapperInfo, onChangeText, onDoneSearching, onStartSearching } = props

  const textInputRef = React.useRef<SimpleTextInputRef>(null)

  const { drawerOpenRatio, setKeepOpen } = useDrawerOpenRatio()

  const inputScale = useDerivedValue(() => drawerOpenRatio.value)

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
    <SceneDrawerWrapper info={sceneWrapperInfo}>
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
    </SceneDrawerWrapper>
  )
}
