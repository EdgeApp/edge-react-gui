// @flow

import * as React from 'react'
import { connect } from 'react-redux'

import type { State } from '../../types/reduxTypes.js'
import EdgeWalletCallbackManager from './EdgeWalletCallbackManager'

type Props = {
  ids: Array<string>
}

class EdgeWalletsManager extends React.Component<Props> {
  render() {
    return this.props.ids.map(id => <EdgeWalletCallbackManager key={id} id={id} />)
  }
}

const mapStateToProps = (state: State): Props => {
  const { currencyWallets = {} } = state.core.account
  return {
    ids: Object.keys(currencyWallets)
  }
}

export default connect(mapStateToProps)(EdgeWalletsManager)
