import React, {Component} from 'react'
import {PasswordRecoveryScreen} from 'airbitz-core-js-ui'

export default class PasswordRecovery extends Component {
  render () {
    return (
      <PasswordRecoveryScreen
        account={this.props.account}
        context={this.props.context}
        onComplete={this.props.onComplete}
        onCancel={this.props.onComplete}
      />
    )
  }
}
