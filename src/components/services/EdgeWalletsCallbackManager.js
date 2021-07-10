// @flow

import * as React from 'react'
import { connect } from 'react-redux'

import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
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

export const EdgeWalletsCallbackManager = connect(
  (state: RootState): StateProps => ({
    ids: Object.keys(state.core.account.currencyWallets)
  }),
  (dispatch: Dispatch) => ({})
)(EdgeWalletsManager)
