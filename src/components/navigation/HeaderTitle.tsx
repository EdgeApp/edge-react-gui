import * as React from 'react'
import { View } from 'react-native'

import { selectWalletFromModal } from '../../actions/WalletActions'
import s from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { ArrowDownTextIconButton } from '../common/ArrowDownTextIconButton'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type OwnProps = {
  showWalletNameOnly?: boolean
  title?: string
}

type StateProps = {
  selectedWalletName: string | null
  selectedWalletCurrencyCode: string
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class HeaderTitleComponent extends React.PureComponent<Props> {
  handlePress = () => {
    // @ts-expect-error
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
