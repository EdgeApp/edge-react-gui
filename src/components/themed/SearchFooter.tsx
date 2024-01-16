import React, { useEffect } from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useDrawerOpenRatio } from '../../state/SceneFooterState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { Space } from '../layout/Space'
import { SceneDrawerWrapper } from './SceneFooterWrapper'
import { SimpleTextInput, SimpleTextInputRef } from './SimpleTextInput'

interface SearchDrawerProps {
  placeholder: string

  isSearching: boolean
  searchText: string
  sceneWrapperInfo: SceneWrapperInfo

  onChangeText: (value: string) => void
  onDoneSearching: () => void
  onStartSearching: () => void
}

export const SearchDrawer = (props: SearchDrawerProps) => {
  const { placeholder, isSearching, searchText, sceneWrapperInfo, onChangeText, onDoneSearching, onStartSearching } = props

  const textInputRef = React.useRef<SimpleTextInputRef>(null)

  const { drawerOpenRatio, setKeepOpen } = useDrawerOpenRatio()

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
          placeholder={placeholder}
          onChangeText={handleSearchChangeText}
          value={searchText}
          onBlur={handleSearchBlur}
          onClear={handleSearchClear}
          onFocus={handleSearchFocus}
          ref={textInputRef}
          iconComponent={SearchIconAnimated}
          scale={drawerOpenRatio}
        />
      </Space>
    </SceneDrawerWrapper>
  )
}
