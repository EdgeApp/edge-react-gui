// @flow

import * as React from 'react'
import { Pressable, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import s from '../../locales/strings.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { type OutlinedTextInputRef, OutlinedTextInput } from './OutlinedTextInput.js'
import Title from './Title'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type Props = {
  walletId: string,
  walletName: string,
  currencyCode: string,
  changeSearchValue: (value: string) => void,
  onSearchClear: () => void,
  onSelectWallet: () => Promise<void>,
  searchValue: string,
  textInput: { current: OutlinedTextInputRef | null }
}

function ManageTokensHeader(props: Props) {
  const { currencyCode, walletName, walletId, changeSearchValue, onSearchClear, onSelectWallet, searchValue, textInput } = props

  const theme = useTheme()

  const LeftIcon = <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} size={theme.rem(1.5)} />
  const RightIcon = <FontAwesomeIcon name="angle-right" color={theme.iconTappable} size={theme.rem(2)} />

  const styles = getStyles(theme)

  return (
    <>
      <Pressable onPress={onSelectWallet}>
        <Title styleRightIcon={styles.rightIcon} leftIcon={LeftIcon} rightIcon={RightIcon} text={walletName} />
      </Pressable>
      <EdgeText style={styles.subTitle}>{s.strings.managetokens_top_instructions}</EdgeText>

      <View style={styles.searchContainer}>
        <View style={styles.searchView}>
          <OutlinedTextInput
            returnKeyType="search"
            label={s.strings.search_tokens}
            onChangeText={changeSearchValue}
            value={searchValue}
            ref={textInput}
            onClear={onSearchClear}
            marginRem={0}
            searchIcon
          />
        </View>
      </View>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(1),
    marginRight: theme.rem(2),
    marginLeft: theme.rem(1)
  },
  searchView: {
    flex: 1,
    flexDirection: 'column'
  },
  rightIcon: {
    marginRight: theme.rem(1)
  }
}))

export default ManageTokensHeader
