// @flow

import * as React from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import { ProgressPie } from '../common/ProgressPie.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

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
  symbolImage?: string,
  walletId: string,
  walletName: string,
  walletProgress: number
}

class WalletListRowComponent extends React.PureComponent<Props & ThemeProps> {
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

  handleOpenWalletListMenuModal = (): void => {
    const { currencyCode, isToken, symbolImage, walletId, walletName } = this.props
    Airship.show(bridge => (
      <WalletListMenuModal bridge={bridge} walletId={walletId} walletName={walletName} currencyCode={currencyCode} image={symbolImage} isToken={isToken} />
    ))
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
      isToken,
      symbolImage,
      theme,
      walletName,
      walletProgress
    } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.container}>
        <TouchableHighlight
          activeOpacity={theme.underlayOpacity}
          underlayColor={theme.underlayColor}
          onPress={this.handleSelectWallet}
          onLongPress={this.handleOpenWalletListMenuModal}
        >
          <View style={[styles.rowContainer, isToken ? styles.tokenBackground : styles.walletBackground]}>
            <View style={styles.iconContainer}>
              {symbolImage && <Image style={styles.icon} source={{ uri: symbolImage }} resizeMode="cover" />}
              <View style={styles.icon}>
                <ProgressPie size={theme.rem(1.25)} color={theme.iconLoadingOverlay} progress={walletProgress} />
              </View>
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailsRow}>
                <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
                <EdgeText style={styles.detailsValue}>{cryptoAmount}</EdgeText>
              </View>
              <View style={styles.detailsRow}>
                <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
                <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalance}</EdgeText>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailsRow}>
                <EdgeText style={styles.exchangeRate}>{exchangeRateFiatSymbol + exchangeRate}</EdgeText>
                <EdgeText style={[styles.percentage, { color: differencePercentageStyle }]}>{differencePercentage}</EdgeText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    marginBottom: theme.rem(1 / 16)
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    height: theme.rem(5.75),
    padding: theme.rem(0.75)
  },
  walletBackground: {
    backgroundColor: theme.tileBackground
  },
  tokenBackground: {
    backgroundColor: theme.tileBackgroundMuted
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(1.25),
    marginRight: theme.rem(0.75)
  },
  icon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: theme.rem(1.25),
    height: theme.rem(1.25),
    resizeMode: 'contain'
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailsCurrency: {
    flex: 1,
    fontFamily: theme.fontFaceBold
  },
  detailsValue: {
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
    flex: 1,
    fontSize: theme.rem(0.75),
    textAlign: 'left'
  },
  percentage: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  },
  divider: {
    height: theme.rem(1 / 16),
    borderColor: theme.lineDivider,
    borderBottomWidth: theme.rem(1 / 16),
    marginVertical: theme.rem(0.5)
  }
}))

export const WalletListRow = withTheme(WalletListRowComponent)
