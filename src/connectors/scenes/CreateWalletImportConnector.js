// @flow

import { connect } from 'react-redux'

import { CreateWalletImportComponent } from '../../components/scenes/CreateWalletImportScene.js'
import { CURRENCY_PLUGIN_NAMES } from '../../constants/indexConstants.js'
import { getAccount } from '../../modules/Core/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'

const mapStateToProps = (state: State, ownProps) => {
  const account = getAccount(state)
  const { currencyCode } = ownProps.selectedWalletType
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  return {
    currencyPlugin
  }
}

const mapDispatchToProps = (dispatch: Dispatch, ownProps) => {
  return {}
}

export const CreateWalletImportConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletImportComponent)
