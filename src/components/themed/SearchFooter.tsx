import React, { useEffect } from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useSceneFooterState } from '../../state/SceneFooterState'
import type { SceneWrapperInfo } from '../common/SceneWrapper'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { SceneFooterWrapper } from './SceneFooterWrapper'
import { SimpleTextInput, type SimpleTextInputRef } from './SimpleTextInput'

interface SearchFooterProps {
  // This component requires a key for the onLayoutHeight prop
  name: string

  placeholder: string

  isSearching: boolean
  searchText: string

  noBackground?: boolean
  sceneWrapperInfo?: SceneWrapperInfo

  onChangeText: (value: string) => void
  onCancel: () => void
  onLayoutHeight: (height: number) => void
  onFocus: () => void
}

export const SearchFooter: React.FC<SearchFooterProps> = props => {
  const {
    name,
    placeholder,
    isSearching,
    searchText,
    noBackground,
    sceneWrapperInfo,

    onChangeText,
    onCancel,
    onLayoutHeight,
    onFocus
  } = props

  const textInputRef = React.useRef<SimpleTextInputRef>(null)

  const footerOpenRatio = useSceneFooterState(state => state.footerOpenRatio)
  const setKeepOpen = useSceneFooterState(state => state.setKeepOpen)
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  //
  // Handlers
  //

  const handleChangeText = useHandler((text: string) => {
    onChangeText(text)
  })

  const handleFooterLayoutHeight = useHandler((height: number) => {
    setFooterHeight(height)
    onLayoutHeight(height)
  })

  //
  // Effects
  //

  useEffect(() => {
    if (setKeepOpen != null) setKeepOpen(isSearching)
    if (isSearching && textInputRef.current != null) {
      textInputRef.current.focus()
    }
    if (!isSearching && textInputRef.current != null) {
      textInputRef.current.blur()
    }
  }, [isSearching, setKeepOpen])

  //
  // Renders
  //

  return (
    <SceneFooterWrapper
      key={`${name}-SceneFooterWrapper`}
      noBackgroundBlur={noBackground}
      sceneWrapperInfo={sceneWrapperInfo}
      onLayoutHeight={handleFooterLayoutHeight}
    >
      <SimpleTextInput
        returnKeyType="search"
        placeholder={placeholder}
        onChangeText={handleChangeText}
        value={searchText}
        active={isSearching}
        onCancel={onCancel}
        onFocus={onFocus}
        ref={textInputRef}
        iconComponent={SearchIconAnimated}
        scale={footerHeight == null ? undefined : footerOpenRatio}
        horizontalRem={1}
        verticalRem={0.5}
      />
    </SceneFooterWrapper>
  )
}
