// @flow

import * as React from 'react'

import { connect } from '../../types/reactRedux.js'
import { EdgeWalletCallbackManager } from './EdgeWalletCallbackManager.js'

type StateProps = {
  ids: string[]
}
type Props = StateProps

class EdgeWalletsManager extends React.Component<Props> {
  render() {
    return this.props.ids.map(id => <EdgeWalletCallbackManager key={id} id={id} />)
  }
}

export const EdgeWalletsCallbackManager = connect<StateProps, {}, {}>(
  state => ({
    ids: Object.keys(state.core.account.currencyWallets)
  }),
  dispatch => ({})
)(EdgeWalletsManager)
