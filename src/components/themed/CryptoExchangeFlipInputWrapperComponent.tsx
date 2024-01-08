import { add } from 'biggystring'
import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { GuiCurrencyInfo } from '../../types/types'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { convertNativeToDenomination } from '../../util/utils'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { EdgeText } from './EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts } from './ExchangedFlipInput2'
import { MainButton } from './MainButton'
import { SelectableRow } from './SelectableRow'

interface OwnProps {
  walletId: string
  buttonText: string
  headerText: string
  primaryCurrencyInfo: GuiCurrencyInfo
  overridePrimaryNativeAmount: string
  isFocused: boolean
  isThinking?: boolean
  focusMe: () => void
  launchWalletSelector: () => void
  onCryptoExchangeAmountChanged: (amounts: ExchangedFlipInputAmounts) => void
  onNext: () => void
  onFocus?: () => void
  onBlur?: () => void
  children?: React.ReactNode
}

interface StateProps {
  name?: string
  cryptoAmount?: string
  tokenId: EdgeTokenId
}

interface State {
  errorMessage?: string
}

type Props = OwnProps & StateProps & ThemeProps

export class CryptoExchangeFlipInputWrapperComponent extends React.Component<Props, State> {
  onAmountsChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.props.onCryptoExchangeAmountChanged(amounts)
  }

  renderLogo = () => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.iconContainer}>
        <CryptoIconUi4 sizeRem={1.75} walletId={this.props.walletId} tokenId={this.props.tokenId} />
      </View>
    )
  }

  renderBalance = () => {
    const { cryptoAmount, primaryCurrencyInfo } = this.props
    const styles = getStyles(this.props.theme)

    if (cryptoAmount == null) {
      return null
    }

    return (
      <EdgeText style={styles.balanceText}>
        {lstrings.string_wallet_balance + ': ' + cryptoAmount + ' ' + primaryCurrencyInfo.displayDenomination.name}
      </EdgeText>
    )
  }

  onError = (errorMessage?: string) => this.setState({ errorMessage })

  clearError = () => this.onError()

  launchSelector = () => {
    this.clearError()
    this.props.launchWalletSelector()
  }

  focusMe = () => {
    this.clearError()
    this.props.focusMe()
  }

  render() {
    const { onNext, primaryCurrencyInfo, name, overridePrimaryNativeAmount, children, theme } = this.props
    const styles = getStyles(theme)

    if (this.props.isThinking) {
      return (
        <View style={[styles.container, styles.containerNoFee, styles.containerNoWalletSelected]}>
          <View style={styles.topRow}>
            <ActivityIndicator color={theme.iconTappable} />
          </View>
        </View>
      )
    }

    if (this.props.walletId === '' || primaryCurrencyInfo == null) {
      return <MainButton label={this.props.buttonText} type="secondary" onPress={this.launchSelector} />
    }
    const guiWalletName = name ?? ''
    const displayDenomination = this.props.primaryCurrencyInfo.displayCurrencyCode

    if (!this.props.isFocused) {
      return (
        <CardUi4 marginRem={[0, 1]} paddingRem={0}>
          <View style={styles.containerSelectedWalletNotFocus}>
            <SelectableRow
              arrowTappable
              icon={<CryptoIconUi4 sizeRem={1.75} walletId={this.props.walletId} tokenId={this.props.tokenId} />}
              title={
                <EdgeText style={styles.iconText} numberOfLines={1}>
                  {guiWalletName + ': ' + displayDenomination}
                </EdgeText>
              }
              onPress={this.focusMe}
            />
          </View>
        </CardUi4>
      )
    }

    return (
      <>
        {this.state?.errorMessage != null ? <EdgeText style={styles.errorText}>{this.state.errorMessage ?? ''}</EdgeText> : null}
        {this.renderBalance()}
        <CardUi4 marginRem={[0, 1]}>
          <ExchangedFlipInput2
            onNext={onNext}
            onFocus={this.props.onFocus}
            onBlur={this.props.onBlur}
            headerText={this.props.headerText}
            headerCallback={this.launchSelector}
            onAmountChanged={this.onAmountsChanged}
            startNativeAmount={overridePrimaryNativeAmount}
            keyboardVisible={false}
            forceField="fiat"
            tokenId={this.props.tokenId}
            walletId={this.props.walletId}
          />
          {children}
        </CardUi4>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    width: '100%'
  },
  containerNoFee: {
    backgroundColor: theme.tileBackground,
    borderRadius: 3
  },
  containerNoWalletSelected: {
    paddingVertical: theme.rem(0.75),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  containerSelectedWalletNotFocus: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  topRow: {
    height: theme.rem(2),
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  iconContainer: {
    top: theme.rem(0.125),
    borderRadius: theme.rem(1)
  },
  currencyIcon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    resizeMode: 'contain'
  },
  textIconContainer: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1.25)
  },
  balanceText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(0.5),
    color: theme.secondaryText
  },
  errorText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(0.75),
    color: theme.dangerText
  }
}))

export const CryptoExchangeFlipInputWrapper = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { currencyWallets } = state.core.account
    const wallet = currencyWallets[ownProps.walletId]
    if (wallet == null) return { tokenId: null }

    const { balanceMap, name } = wallet
    const { displayCurrencyCode, displayDenomination } = ownProps.primaryCurrencyInfo

    const tokenId = getTokenIdForced(state.core.account, wallet.currencyInfo.pluginId, displayCurrencyCode)

    const balance = balanceMap.get(tokenId) ?? '0'
    const cryptoAmountRaw: string = convertNativeToDenomination(displayDenomination.multiplier)(balance)
    const cryptoAmount = formatNumber(add(cryptoAmountRaw, '0'))

    return { name: name ?? '', cryptoAmount, tokenId }
  },
  dispatch => ({})
)(withTheme(CryptoExchangeFlipInputWrapperComponent))
