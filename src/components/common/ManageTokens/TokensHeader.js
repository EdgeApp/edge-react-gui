// @flow

import * as React from 'react'
import { View } from 'react-native'

import s from '../../../locales/strings.js'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { EdgeTextFieldOutlined } from '../../themed/EdgeTextField'
import Title from '../../themed/Title'
import { WalletProgressIcon } from '../../themed/WalletProgressIcon.js'

type Props = {
  sorting?: boolean,
  searching?: boolean,
  walletId: string,
  walletName: string,
  currencyCode: string,
  changeSearchValue: (value: string) => void,
  searchValue: string
}

function TokensHeader(props: Props) {
  const { currencyCode, walletName, walletId, changeSearchValue, searchValue } = props

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
        <View style={styles.searchView}>
          <EdgeTextFieldOutlined
            returnKeyType="search"
            label={s.strings.search_tokens}
            onChangeText={changeSearchValue}
            value={searchValue}
            onFocus={this.handleTextFieldFocus}
            ref={this.textInput}
            onClear={this.clearText}
            marginRem={0}
            small
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
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(2),
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(-1)
  },
  searchView: {
    flex: 1,
    flexDirection: 'column'
  }
}))

export default TokensHeader
