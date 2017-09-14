import React, {Component} from 'react'
import {ChangePinScreen} from 'airbitz-core-js-ui'

export default class ChangePassword extends Component {
  onComplete = () => {
    this.props.onComplete()
  }

  render () {
    return (
      <ChangePinScreen
        accountObject={this.props.accountObject}
        context={this.props.context}
        onComplete={this.onComplete}
        onCancel={this.onComplete}
      />
    )
  }
}
