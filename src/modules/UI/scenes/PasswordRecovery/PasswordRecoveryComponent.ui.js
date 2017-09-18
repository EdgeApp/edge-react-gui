import React, {Component} from 'react'
import {PasswordRecoveryScreen} from 'airbitz-core-js-ui'

export default class PasswordRecovery extends Component {
  onComplete = () => {
    this.props.onComplete()
  }

  render () {
    return (
      <PasswordRecoveryScreen
        account={this.props.account}
        context={this.props.context}
        onComplete={this.onComplete}
        onCancel={this.onComplete}
      />
    )
  }
}
