import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { Linking, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import {
  isUtxoPluginId,
  SPECIAL_CURRENCY_INFO
} from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeButton } from '../buttons/EdgeButton'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { ButtonBox } from './ThemedButtons'

const transactionListUnsupportedPluginIds = Object.keys(
  SPECIAL_CURRENCY_INFO
).filter(
  pluginId =>
    SPECIAL_CURRENCY_INFO[pluginId].isTransactionListUnsupported === true
)

interface OwnProps {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
}

type Props = OwnProps

interface ExplorerLinkProps {
  wallet: EdgeCurrencyWallet
}

export const ExplorerCard: React.FC<Props> = (props: Props) => {
  const { wallet, tokenId } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { addressExplorer, pluginId } = wallet.currencyInfo

  //
  // Handlers
  //

  const handlePress = useHandler(async () => {
    await showAddressInExplorer(wallet)
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
            <CryptoIcon
              pluginId={pluginId}
              tokenId={tokenId}
              marginRem={[0.25, 0]}
              sizeRem={2.25}
            />
            <EdgeText style={styles.explorerButtonText}>
              {lstrings.transaction_details_advance_details_show_explorer}
            </EdgeText>
          </View>
        )}
      </ButtonBox>
      <View style={styles.noTransactionContainer}>
        <EdgeText style={styles.noTransactionText}>
          {lstrings.transaction_list_no_tx_support_yet}
        </EdgeText>
      </View>
    </View>
  )
}

/**
 * A "Show in Explorer" button for wallets whose transaction list may still be
 * loading or may never finish syncing. Renders nothing if the chain has no
 * address explorer, or on UTXO chains, where the receive address is a fresh
 * one that holds none of the wallet's history.
 */
export const ExplorerLink: React.FC<ExplorerLinkProps> = props => {
  const { wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useHandler(async () => {
    await showAddressInExplorer(wallet)
  })

  const { addressExplorer, pluginId } = wallet.currencyInfo
  if (addressExplorer === '' || isUtxoPluginId(pluginId)) return null

  return (
    <View style={styles.explorerLinkContainer}>
      <EdgeButton
        label={lstrings.transaction_details_advance_details_show_explorer}
        mini
        type="secondary"
        onPress={handlePress}
      />
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
  },
  explorerLinkContainer: {
    marginVertical: theme.rem(1)
  }
}))

/**
 * Opens the wallet's receive address on the chain's address explorer.
 */
async function showAddressInExplorer(
  wallet: EdgeCurrencyWallet
): Promise<void> {
  const { addressExplorer } = wallet.currencyInfo
  const addresses = await wallet.getAddresses({ tokenId: null })
  const primaryAddress =
    addresses.find(address => address.addressType === 'publicAddress') ??
    addresses[0]
  if (primaryAddress == null) return
  const url = sprintf(addressExplorer, primaryAddress.publicAddress)
  await Linking.openURL(url)
}
