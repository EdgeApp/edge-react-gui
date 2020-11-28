// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { connect } from 'react-redux'

import { selectWalletFromModal } from '../../actions/WalletActions.js'
import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { B } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { Airship } from '../services/AirshipInstance.js'

type StateProps = {
  selectedWalletName: string | null,
  selectedWalletCurrencyCode: string
}

type DispatchProps = {
  onSelectWallet(string, string): void
}

type Props = StateProps & DispatchProps

class HeaderWalletSelectorComponent extends React.Component<Props> {
  handlePress = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} />).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.props.onSelectWallet(walletId, currencyCode)
      }
    })
  }

  render() {
    return (
      <TouchableOpacity onPress={this.handlePress} style={styles.textIconContainer}>
        <T style={styles.iconText} ellipsizeMode="middle" numberOfLines={1}>
          {this.props.selectedWalletName ? (
            <>
              {this.props.selectedWalletName}: <B>{this.props.selectedWalletCurrencyCode}</B>
            </>
          ) : (
            s.strings.loading
          )}
        </T>
        <MaterialIcon name="keyboard-arrow-down" color={THEME.COLORS.WHITE} size={THEME.rem(1.5)} />
      </TouchableOpacity>
    )
  }
}

const styles = {
  textIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  iconText: {
    textAlign: 'center',
    color: THEME.COLORS.WHITE,
    fontSize: THEME.rem(1.25)
  }
}

export const HeaderWalletSelector = connect(
  (state: RootState): StateProps => {
    const walletId = state.ui.wallets.selectedWalletId
    const selectedWallet = state.ui.wallets.byId[walletId]
    return {
      selectedWalletName: selectedWallet ? selectedWallet.name : null,
      selectedWalletCurrencyCode: state.ui.wallets.selectedCurrencyCode
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletFromModal(walletId, currencyCode))
    }
  })
)(HeaderWalletSelectorComponent)
