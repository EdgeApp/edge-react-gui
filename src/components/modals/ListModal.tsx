import { FlashList, ListRenderItem } from '@shopify/flash-list'
import * as React from 'react'
import { Keyboard, ViewStyle, ViewToken } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { useFilter } from '../../hooks/useFilter'
import { useTheme } from '../services/ThemeContext'
import { ModalFooter, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { ThemedModal } from '../themed/ThemedModal'

interface Props<T> {
  bridge: AirshipBridge<any>
  // Header Props
  title?: string
  message?: string
  textInput?: boolean // Defaults to 'true'
  initialValue?: string // Defaults to ''
  // OutlinedTextInput properties:
  searchIcon?: boolean // Defaults to 'true'
  label?: string // Defaults to ''
  autoCorrect?: boolean // Defaults to 'false'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' // Defaults to 'words'
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send' // Defaults to 'search'
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad' // Defaults to 'default'
  blurOnSubmit?: boolean // Defaults to 'true'
  inputAccessoryViewID?: string
  maxLength?: number
  onSubmitEditing?: (text: string) => void
  secureTextEntry?: boolean // Defaults to 'false'
  autoFocus?: boolean // Defaults to 'false'
  blurOnClear?: boolean // Defaults to 'true'
  // List Props
  rowsData?: T[] // Defaults to []
  fullScreen?: boolean
  rowComponent?: (props: T) => React.ReactElement
  rowDataFilter?: (filterText: string, data: T, index: number) => boolean
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void
  // Footer Props
  closeArrow?: boolean // Defaults to 'true'
}

export function ListModal<T>({
  bridge,
  title,
  message,
  textInput = true,
  initialValue = '',
  rowsData = [],
  fullScreen = true,
  rowComponent,
  rowDataFilter,
  closeArrow = true,
  onSubmitEditing,
  onViewableItemsChanged,
  ...textProps
}: Props<T>) {
  const theme = useTheme()
  const [text, setText] = React.useState<string>(initialValue)
  const [filteredRows, setFilteredRows] = useFilter(rowsData, rowDataFilter)
  const renderItem: ListRenderItem<T> = ({ item }) => (rowComponent ? rowComponent(item) : null)
  const handleCancel = () => bridge.resolve(undefined)
  const handleChangeText = (text: string) => {
    setText(text)
    setFilteredRows(text)
  }

  const handleSubmitEditing = () => (onSubmitEditing != null ? onSubmitEditing(text) : bridge.resolve(text))

  const scrollPadding = React.useMemo<ViewStyle>(() => {
    return { paddingBottom: theme.rem(ModalFooter.bottomRem) }
  }, [theme])

  return (
    <ThemedModal bridge={bridge} closeButton={closeArrow} onCancel={handleCancel}>
      {title == null ? null : <ModalTitle>{title}</ModalTitle>}
      {message == null ? null : <ModalMessage>{message}</ModalMessage>}
      {textInput == null ? null : (
        <OutlinedTextInput
          // Our props:
          searchIcon
          blurOnClear
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          marginRem={[1, 0.5]}
          testID={title}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmitEditing}
          value={text}
          // Outlined Text input props:
          {...textProps}
        />
      )}
      <FlashList
        contentContainerStyle={scrollPadding}
        data={filteredRows}
        estimatedItemSize={theme.rem(5)}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(_, i) => `${i}`}
        renderItem={renderItem}
        onScroll={() => Keyboard.dismiss()}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </ThemedModal>
  )
}
