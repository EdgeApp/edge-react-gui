import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { Linking, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { EdgeText } from './EdgeText'
import { ButtonBox } from './ThemedButtons'

const transactionListUnsupportedPluginIds = Object.keys(SPECIAL_CURRENCY_INFO).filter(
  pluginId => !!SPECIAL_CURRENCY_INFO[pluginId].isTransactionListUnsupported
)

interface OwnProps {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
}

type Props = OwnProps

export const ExplorerCard = (props: Props) => {
  const { wallet, tokenId } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { addressExplorer, pluginId } = wallet.currencyInfo

  //
  // Handlers
  //

  const handlePress = useHandler(async () => {
    const receiveAddress = await wallet.getReceiveAddress({ tokenId: null })
    const url = sprintf(addressExplorer, receiveAddress.publicAddress)
    await Linking.openURL(url)
  })

  //
  // Render
  //

  if (!transactionListUnsupportedPluginIds.includes(pluginId)) return null

  return (
    <View>
      <ButtonBox onPress={handlePress} paddingRem={1}>
        {addressExplorer === '' ? null : (
          <View style={styles.container}>
            <CryptoIconUi4 walletId={wallet.id} tokenId={tokenId} marginRem={[0.25, 0]} sizeRem={2.25} />
            <EdgeText style={styles.explorerButtonText}>{lstrings.transaction_details_advance_details_show_explorer}</EdgeText>
          </View>
        )}
      </ButtonBox>
      <View style={styles.noTransactionContainer}>
        <EdgeText style={styles.noTransactionText}>{lstrings.transaction_list_no_tx_support_yet}</EdgeText>
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.rem(1),
    backgroundColor: theme.tileBackground
  },
  explorerButtonText: {
    fontFamily: theme.fontFaceMedium,
    marginVertical: theme.rem(0.25)
  },
  noTransactionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(1)
  },
  noTransactionText: {
    fontFamily: theme.fontFaceMedium,
    color: theme.primaryText,
    textAlign: 'center'
  }
}))
