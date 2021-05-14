// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import s from '../../../locales/strings.js'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { EdgeTextFieldOutlined } from '../../themed/EdgeTextField'
import Title from '../../themed/Title'
import { WalletProgressIcon } from '../../themed/WalletProgressIcon.js'

type Props = {
  sorting?: boolean,
  searching?: boolean,
  searchText?: string,
  walletId: string,
  walletName: string,
  currencyCode: string
}

function TokensHeader(props: Props) {
  // const textInput = React.createRef()

  const { searching, searchText, currencyCode, walletName, walletId } = props

  const theme = useTheme()

  const Icon = <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} size={theme.rem(1.5)} />

  const styles = getStyles(theme)

  return (
    <>
      <View>
        <Title icon={Icon} text={walletName} />
        <EdgeText style={styles.subTitle}>{s.strings.managetokens_top_instructions}</EdgeText>
      </View>
      <View style={styles.searchContainer}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <EdgeTextFieldOutlined
            returnKeyType="search"
            label={s.strings.wallet_list_wallet_search}
            onChangeText={this.handleOnChangeText}
            value={searchText}
            onFocus={this.handleTextFieldFocus}
            ref={this.textInput}
            isClearable={searching}
            onClear={this.clearText}
            marginRem={0}
          />
        </View>
        {searching && (
          <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
            <EdgeText style={{ color: theme.textLink }}>{s.strings.string_done_cap}</EdgeText>
          </TouchableOpacity>
        )}
      </View>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    paddingBottom: theme.rem(0.25)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  searchDoneButton: {
    justifyContent: 'center',
    height: theme.rem(4.5),
    paddingLeft: theme.rem(0.75),
    paddingBottom: theme.rem(0.25)
  }
}))

export default TokensHeader
