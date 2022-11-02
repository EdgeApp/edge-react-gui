import * as React from 'react'
import { FlatList, Keyboard, ListRenderItem, ViewToken } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { useFilter } from '../../hooks/useFilter'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts'
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
  const [text, setText] = React.useState<string>(initialValue)
  const [filteredRows, setFilteredRows] = useFilter(rowsData, rowDataFilter)
  const renderItem: ListRenderItem<T> = ({ item }) => (rowComponent ? rowComponent(item) : null)
  const handleCancel = () => bridge.resolve(undefined)
  const handleChangeText = (text: string) => {
    setText(text)
    setFilteredRows(text)
  }

  const handleSubmitEditing = () => (onSubmitEditing != null ? onSubmitEditing(text) : bridge.resolve(text))

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      {message != null ? <ModalMessage>{message}</ModalMessage> : null}
      {textInput && (
        <OutlinedTextInput
          // Our props:
          searchIcon
          blurOnClear
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          marginRem={[1, 0.5]}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmitEditing}
          value={text}
          // Outlined Text input props:
          {...textProps}
        />
      )}
      <FlatList
        style={{ flexGrow: fullScreen ? 1 : 0 }}
        data={filteredRows}
        initialNumToRender={12}
        onScroll={() => Keyboard.dismiss()}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        keyExtractor={(_, i) => `${i}`}
        onViewableItemsChanged={onViewableItemsChanged}
      />
      {closeArrow && <ModalCloseArrow onPress={handleCancel} />}
    </ThemedModal>
  )
}
