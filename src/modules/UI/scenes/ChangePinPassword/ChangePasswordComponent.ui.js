import React, {Component} from 'react'
import {ChangePasswordScreen} from 'airbitz-core-js-ui'

export default class ChangePassword extends Component {
  onComplete = () => {
    this.props.onComplete()
  }

  render () {
    return (
      <ChangePasswordScreen
        account={this.props.account}
        context={this.props.context}
        onComplete={this.onComplete}
        onCancel={this.onComplete}
        showHeader={this.props.showHeader}
      />
    )
  }
}
