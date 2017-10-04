import React, {Component} from 'react'
import {connect} from 'react-redux'
import {LoginScreen} from 'airbitz-core-js-ui'
import makeAccountCallbacks from '../../../Core/Account/callbacks'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {initializeAccount} from '../../../Login/action'
import {Actions} from 'react-native-router-flux'

class Login extends Component {
  onLogin = (error = null, account) => {
    if (error || !account) return
    Actions.edge()
    this.props.initializeAccount(account)
  }

  render () {
    const callbacks = makeAccountCallbacks(this.props.dispatch)
    return !this.props.context.listUsernames ? null : (
      <LoginScreen
        username={this.props.username}
        accountOptions={{callbacks}}
        context={this.props.context}
        onLogin={this.onLogin}
      />
    )
  }
}

const mapStateToProps = (state) => ({
  context: CORE_SELECTORS.getContext(state)
})
const mapDispatchToProps = (dispatch) => ({
  initializeAccount: (account) => dispatch(initializeAccount(account))
})

export default connect(mapStateToProps, mapDispatchToProps)(Login)
