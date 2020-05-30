// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/scenes/FioAddressDetailsScene'
import { FioAddressDetailsScene } from '../../components/scenes/FioAddressDetailsScene'
import { getFioWallets } from '../../modules/UI/selectors'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const fioWallets = getFioWallets(state)

  const out: StateProps = {
    fioWallets
  }
  return out
}

export const FioAddressDetailsConnector = connect(mapStateToProps, {})(FioAddressDetailsScene)
