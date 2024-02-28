import { add } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { GuiCurrencyInfo } from '../../types/types'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDenomination } from '../../util/utils'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { RowUi4 } from '../ui4/RowUi4'
import { EdgeText } from './EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts } from './ExchangedFlipInput2'
import { MainButton } from './MainButton'

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
  wallet: EdgeCurrencyWallet | undefined
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
    const { onNext, primaryCurrencyInfo, name, overridePrimaryNativeAmount, children, theme, wallet } = this.props
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

    if (wallet == null || primaryCurrencyInfo == null) {
      return <MainButton label={this.props.buttonText} type="secondary" onPress={this.launchSelector} />
    }
    const guiWalletName = name ?? ''
    const displayDenomination = this.props.primaryCurrencyInfo.displayCurrencyCode

    if (!this.props.isFocused) {
      return (
        <CardUi4>
          <RowUi4 icon={<CryptoIconUi4 sizeRem={1.75} walletId={this.props.walletId} tokenId={this.props.tokenId} />} onPress={this.focusMe}>
            <EdgeText style={styles.text}>{guiWalletName + ': ' + displayDenomination}</EdgeText>
          </RowUi4>
        </CardUi4>
      )
    }

    return (
      <>
        {this.state?.errorMessage != null ? <EdgeText style={styles.errorText}>{this.state.errorMessage ?? ''}</EdgeText> : null}
        {this.renderBalance()}
        <CardUi4>
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
            wallet={wallet}
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
  text: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    marginLeft: theme.rem(0.5)
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
  balanceText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    color: theme.secondaryText
  },
  errorText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(0.5),
    marginBottom: theme.rem(0.75),
    color: theme.dangerText
  }
}))

export const CryptoExchangeFlipInputWrapper = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { currencyWallets } = state.core.account
    const wallet = currencyWallets[ownProps.walletId]
    if (wallet == null) return { tokenId: null, wallet: undefined }

    const { displayCurrencyCode, displayDenomination } = ownProps.primaryCurrencyInfo

    const tokenId = getTokenIdForced(state.core.account, wallet.currencyInfo.pluginId, displayCurrencyCode)

    const balance = wallet.balanceMap.get(tokenId) ?? '0'
    const cryptoAmountRaw: string = convertNativeToDenomination(displayDenomination.multiplier)(balance)
    const cryptoAmount = formatNumber(add(cryptoAmountRaw, '0'))

    return { name: getWalletName(wallet), cryptoAmount, tokenId, wallet }
  },
  dispatch => ({})
)(withTheme(CryptoExchangeFlipInputWrapperComponent))
