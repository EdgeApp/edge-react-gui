import * as React from 'react'
import { Keyboard, ListRenderItem, ViewStyle, ViewToken } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useFilter } from '../../hooks/useFilter'
import { useTheme } from '../services/ThemeContext'
import { FilledTextInput } from '../themed/FilledTextInput'
import { ModalFooter, ModalMessage } from '../themed/ModalParts'
import { ModalUi4 } from '../ui4/ModalUi4'

interface Props<T> {
  bridge: AirshipBridge<any>
  // Header Props
  title?: string
  message?: string
  textInput?: boolean // Defaults to 'true'
  initialValue?: string // Defaults to ''
  // FilledTextInput properties:
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
  // List Props
  rowsData?: T[] // Defaults to []
  fullScreen?: boolean
  rowComponent?: (props: T) => React.ReactElement
  rowDataFilter?: (filterText: string, data: T, index: number) => boolean
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void
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
  onSubmitEditing,
  onViewableItemsChanged,
  label: placeholder,
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
    <ModalUi4 title={title} bridge={bridge} onCancel={handleCancel}>
      {message == null ? null : <ModalMessage>{message}</ModalMessage>}
      {!textInput ? null : (
        <FilledTextInput
          vertical={1}
          horizontal={0.5}
          // Our props:
          searchIcon
          blurOnClear={false}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          testID={title}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmitEditing}
          value={text}
          placeholder={placeholder}
          // Outlined Text input props:
          {...textProps}
        />
      )}
      <FlatList
        contentContainerStyle={scrollPadding}
        data={filteredRows}
        // estimatedItemSize={theme.rem(5)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(_, i) => `${i}`}
        renderItem={renderItem}
        onScroll={() => Keyboard.dismiss()}
        onViewableItemsChanged={onViewableItemsChanged}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      />
    </ModalUi4>
  )
}
