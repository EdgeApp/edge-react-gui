// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/scenes/FioAddressDetailsScene'
import { FioAddressDetailsScene } from '../../components/scenes/FioAddressDetailsScene'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { fioAddress } = state.ui.scenes

  const out: StateProps = {
    fioAddressName: fioAddress.fioAddressName,
    expiration: fioAddress.expiration
  }
  return out
}

export const FioAddressDetailsConnector = connect(
  mapStateToProps,
  {}
)(FioAddressDetailsScene)
