import React, {Component} from 'react'
import {ChangePasswordScreen} from 'airbitz-core-js-ui'

export default class ChangePassword extends Component {
  onComplete = () => {
    this.props.onComplete()
  }

  render () {
    return (
      <ChangePasswordScreen
        accountObject={this.props.accountObject}
        context={this.props.context}
        onComplete={this.onComplete}
        onCancel={this.onComplete}
      />
    )
  }
}
