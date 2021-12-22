// @flow

import * as React from 'react'
import { View } from 'react-native'

import { selectWalletFromModal } from '../../actions/WalletActions.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { ArrowDownTextIconButton } from '../common/ArrowDownTextIconButton.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type OwnProps = {
  showWalletNameOnly?: boolean,
  title?: string
}

type StateProps = {
  selectedWalletName: string | null,
  selectedWalletCurrencyCode: string
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class HeaderTitleComponent extends React.PureComponent<Props> {
  handlePress = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} />).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.props.onSelectWallet(walletId, currencyCode)
      }
    })
  }

  renderWalletName = () => {
    const styles = getStyles(this.props.theme)
    if (this.props.selectedWalletName) {
      return (
        <EdgeText>
          {this.props.selectedWalletName + ': '}
          <EdgeText style={styles.boldText}>{this.props.selectedWalletCurrencyCode}</EdgeText>
        </EdgeText>
      )
    } else {
      return <EdgeText>{s.strings.loading}</EdgeText>
    }
  }

  renderWalletNameSection = () => {
    return this.props.showWalletNameOnly ? this.renderWalletName() : <ArrowDownTextIconButton onPress={this.handlePress} title={this.renderWalletName()} />
  }

  render() {
    const { title, theme } = this.props
    const styles = getStyles(theme)
    return <View style={styles.container}>{title ? <EdgeText>{title}</EdgeText> : this.renderWalletNameSection()}</View>
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.rem(1.5),
    paddingBottom: theme.rem(0.25)
  },
  boldText: {
    fontFamily: theme.fontFaceBold
  }
}))

export const HeaderTitle = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const walletId = state.ui.wallets.selectedWalletId
    const selectedWallet = state.ui.wallets.byId[walletId]

    return {
      selectedWalletName: selectedWallet ? selectedWallet.name : null,
      selectedWalletCurrencyCode: state.ui.wallets.selectedCurrencyCode
    }
  },
  dispatch => ({
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletFromModal(walletId, currencyCode))
    }
  })
)(withTheme(HeaderTitleComponent))
