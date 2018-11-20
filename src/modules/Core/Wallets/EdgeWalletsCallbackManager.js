// @flow

import React from 'react'
import { connect } from 'react-redux'

import type { State } from '../../ReduxTypes.js'
import EdgeWalletCallbackManager from './EdgeWalletCallbackManager'

type Props = {
  ids: Array<string>
}

class EdgeWalletsManager extends React.Component<Props> {
  render () {
    return this.props.ids.map(id => <EdgeWalletCallbackManager key={id} id={id} />)
  }
}

const mapStateToProps = (state: State): Props => {
  const ids = Object.keys(state.core.wallets.byId)
  return {
    ids
  }
}

export default connect(mapStateToProps)(EdgeWalletsManager)
