// @flow

import * as React from 'react'
import { FlatList, Keyboard } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { useFilter } from '../../hooks/useFilter.js'
import { useState } from '../../types/reactHooks.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type Props<T> = {
  // Modal Props
  bridge: AirshipBridge<any>,
  onCancel?: () => void, // Defaults to () => bridge.resolve()
  // Header Props
  title?: string,
  textInput?: boolean, // Defaults to 'true'
  initialValue?: string, // Defaults to ''
  // OutlinedTextInput properties:
  searchIcon?: boolean, // Defaults to 'true'
  label?: string, // Defaults to ''
  autoCorrect?: boolean, // Defaults to 'false'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters', // Defaults to 'words'
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send', // Defaults to 'search'
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad', // Defaults to 'default'
  blurOnSubmit?: boolean, // Defaults to 'true'
  inputAccessoryViewID?: string,
  maxLength?: number,
  onSubmitEditing?: (text: string) => void,
  secureTextEntry?: boolean, // Defaults to 'false'
  autoFocus?: boolean, // Defaults to 'false'
  blurOnClear?: boolean, // Defaults to 'true'
  // List Props
  rowsData?: T[], // Defaults to []
  rowComponent?: (props: T) => React.Node,
  rowDataFilter?: (filterText: string, data: T, index: number) => boolean,
  // Footer Props
  closeArrow?: boolean // Defaults to 'true'
}

export function ListModal<T>(props: Props<T>) {
  const {
    bridge,
    title,
    textInput = true,
    initialValue = '',
    rowsData = [],
    rowComponent,
    rowDataFilter,
    closeArrow = true,
    onSubmitEditing,
    onCancel = () => bridge.resolve(),
    ...textProps
  } = props

  const [text, setText] = useState<string>(initialValue)
  const [filteredRows, setFilteredRows] = useFilter(rowsData, rowDataFilter)
  const renderItem = ({ item }) => (rowComponent ?? ((item: any) => null))(item)

  const handleChangeText = (text: string) => {
    setText(text)
    setFilteredRows(text)
  }

  const handleSubmitEditing = () => (onSubmitEditing != null ? onSubmitEditing(text) : bridge.resolve(text))
  return (
    <ThemedModal bridge={bridge} onCancel={onCancel}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
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
        style={{ flex: 1 }}
        data={filteredRows}
        initialNumToRender={12}
        onScroll={() => Keyboard.dismiss()}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        keyExtractor={(_, i) => `${i}`}
      />
      {closeArrow && <ModalCloseArrow onPress={onCancel} />}
    </ThemedModal>
  )
}
