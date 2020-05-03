// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/scenes/FioAddressDetailsScene'
import { FioAddressDetailsScene } from '../../components/scenes/FioAddressDetailsScene'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { fioAddressName, expiration } = state.ui.scenes.fioAddress

  const out: StateProps = {
    fioAddressName,
    expiration
  }
  return out
}

export const FioAddressDetailsConnector = connect(
  mapStateToProps,
  {}
)(FioAddressDetailsScene)
