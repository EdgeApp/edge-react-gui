// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index.js'
import { CREATE_WALLET_SELECT_CRYPTO } from '../../constants/SceneKeys.js'
import { useHandler } from '../../hooks/useHandler.js'
import s from '../../locales/strings.js'
import { useEffect, useRef } from '../../types/reactHooks.js'
import { Actions } from '../../types/routerTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { WiredBalanceBox } from '../themed/WiredBalanceBox.js'
import { type OutlinedTextInputRef, OutlinedTextInput } from './OutlinedTextInput.js'
import { PromoBanner } from './PromoBanner.js'

type OwnProps = {
  sorting: boolean,
  searching: boolean,
  searchText: string,
  openSortModal: () => void,
  onChangeSearchText: (search: string) => void,
  onChangeSearchingState: (searching: boolean) => void
}

type Props = OwnProps

export const WalletListHeader = (props: Props) => {
  const { sorting, searching, searchText, openSortModal, onChangeSearchText, onChangeSearchingState } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const textInput = useRef<OutlinedTextInputRef>(null)

  useEffect(() => {
    if (textInput.current != null && searching === true) {
      textInput.current.focus()
    }
  }, [searching, textInput])

  const handleSearchDone = useHandler(() => {
    onChangeSearchingState(false)
    if (textInput.current != null) {
      textInput.current.clear()
    }
  })

  const handleChangeText = useHandler(input => onChangeSearchText(input))
  const handleFocus = useHandler(() => onChangeSearchingState(true))
  const handleCreateWallet = useHandler(() => Actions.push(CREATE_WALLET_SELECT_CRYPTO))

  return (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchTextInput}>
          <OutlinedTextInput
            returnKeyType="search"
            label={s.strings.wallet_list_wallet_search}
            onChangeText={handleChangeText}
            value={searchText}
            onFocus={handleFocus}
            ref={textInput}
            marginRem={0}
            searchIcon
          />
        </View>
        {searching && (
          <TouchableOpacity onPress={handleSearchDone} style={styles.searchDoneButton}>
            <EdgeText style={styles.searchDoneButtonText}>{s.strings.string_done_cap}</EdgeText>
          </TouchableOpacity>
        )}
      </View>
      {!searching && <WiredBalanceBox />}
      {!sorting && !searching && (
        <View style={styles.headerContainer}>
          <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
          <View key="defaultButtons" style={styles.headerButtonsContainer}>
            <TouchableOpacity style={styles.addButton} onPress={handleCreateWallet}>
              <Ionicon name="md-add" size={theme.rem(1.5)} color={theme.iconTappable} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openSortModal}>
              <Fontello name="sort" size={theme.rem(1.5)} color={theme.iconTappable} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!searching && <PromoBanner />}
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButton: {
    marginRight: theme.rem(0.5)
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(1),
    marginBottom: theme.rem(1)
  },
  searchTextInput: {
    flex: 1,
    flexDirection: 'column'
  },
  searchDoneButton: {
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75),
    paddingBottom: theme.rem(1)
  },
  searchDoneButtonText: { color: theme.textLink }
}))
