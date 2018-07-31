// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes.js'
import * as CORE_SELECTORS from '../../../../../Core/selectors'
import WalletListRowOptions from './WalletListRowOptions.ui'
import * as Constants from '../../../../../../constants/indexConstants'
import type { WalletListRowOptionsOwnProps } from './WalletListRowOptions.ui.js'

const mapStateToProps = (state: State, ownProps: WalletListRowOptionsOwnProps) => {
  const account = CORE_SELECTORS.getAccount(state)
  const walletId = ownProps.walletId
  const splittableWalletTypes = state.ui.wallets.byId[walletId].splittableWalletTypes
  const options = []

  for (const walletOption in Constants.WALLET_OPTIONS) {
    const option = Constants.WALLET_OPTIONS[walletOption]
    if (walletOption === 'SPLIT') {
      options.push(...splittableWalletTypes)
    } else if (!option.currencyCode || option.currencyCode.includes(ownProps.currencyCode)) {
      const temp = {
        value: option.value,
        label: option.label
      }
      options.push(temp)
    }
  }
  return {
    account,
    options
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListRowOptions)
