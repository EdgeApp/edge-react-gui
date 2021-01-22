// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type Props = {
  cryptoAmount: string,
  currencyCode: string,
  differencePercentage: string,
  differencePercentageStyle: string,
  exchangeRate: string,
  exchangeRateFiatSymbol: string,
  fiatBalance: string,
  fiatBalanceSymbol: string,
  isToken: boolean,
  publicAddress: string,
  selectWallet(walletId: string, currencyCode: string): void,
  handleOpenWalletListMenuModal({ currencyCode: string, isToken: boolean, symbolImage?: string, walletId: string, walletName: string }): void,
  symbolImage?: string,
  walletId: string,
  walletName: string
}

class WalletListRowComponent extends React.PureComponent<Props & ThemeProps> {
  handleOpenWalletListMenuModal = (): void => {
    const { currencyCode, isToken, symbolImage, walletId, walletName, handleOpenWalletListMenuModal } = this.props
    handleOpenWalletListMenuModal({ currencyCode, isToken, symbolImage, walletId, walletName })
  }

  handleSelectWallet = (): void => {
    const { currencyCode, isToken, publicAddress, walletId } = this.props
    this.props.selectWallet(walletId, currencyCode)
    if (!isToken) {
      // if it's EOS then we need to see if activated, if not then it will get routed somewhere else
      // if it's not EOS then go to txList, if it's EOS and activated with publicAddress then go to txList
      const { isAccountActivationRequired } = getSpecialCurrencyInfo(currencyCode)
      if (!isAccountActivationRequired || (isAccountActivationRequired && publicAddress)) {
        Actions.transactionList({ params: 'walletList' })
      }
    } else {
      Actions.transactionList({ params: 'walletList' })
    }
  }

  render() {
    const {
      currencyCode,
      cryptoAmount,
      differencePercentage,
      differencePercentageStyle,
      exchangeRate,
      exchangeRateFiatSymbol,
      fiatBalance,
      fiatBalanceSymbol,
      theme,
      walletId,
      walletName
    } = this.props
    const styles = getStyles(theme)
    return (
      <Gradient style={styles.container}>
        <TouchableOpacity onPress={this.handleSelectWallet} onLongPress={this.handleOpenWalletListMenuModal}>
          <View style={styles.rowContainer}>
            <View style={styles.iconContainer}>
              <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} />
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailsRow}>
                <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
                <EdgeText style={[styles.exchangeRate, { color: differencePercentageStyle }]}>
                  {exchangeRateFiatSymbol + exchangeRate + '  ' + differencePercentage}
                </EdgeText>
                <EdgeText style={styles.detailsValue}>{cryptoAmount}</EdgeText>
              </View>
              <View style={styles.detailsRow}>
                <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
                <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalance}</EdgeText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Gradient>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    marginVertical: theme.rem(1)
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailsCurrency: {
    fontFamily: theme.fontFaceBold,
    marginRight: theme.rem(0.75)
  },
  detailsValue: {
    marginLeft: theme.rem(0.5),
    textAlign: 'right'
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  detailsFiat: {
    fontSize: theme.rem(0.75),
    textAlign: 'right',
    color: theme.secondaryText
  },
  exchangeRate: {
    flex: 1
  }
}))

const WalletListRow = withTheme(WalletListRowComponent)
// Lint error about component not having a displayName
// WalletListRow.displayName = 'WalletListRow'
export { WalletListRow }
