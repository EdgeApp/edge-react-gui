import React, {Component} from 'react'
import {connect} from 'react-redux'
import {LoginScreen} from 'airbitz-core-js-ui'
import makeAccountCallbacks from '../../../Core/Account/callbacks'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {initializeAccount} from '../../../Login/action'
import {Actions} from 'react-native-router-flux'

class Login extends Component {
  constructor (props) {
    super(props)
    this.state = {key: 0}
  }

  onLogin = (error = null, account) => {
    if (error || !account) return
    Actions.edge()
    this.props.initializeAccount(account)
  }

  componentWillReceiveProps (nextProps) {
    // If we have logged out, destroy and recreate the login screen:
    if (this.props.account && (nextProps.account !== this.props.account))
      if (typeof nextProps.account.username === 'undefined') {
        this.setState({key: this.state.key + 1})
      }
  }

  render () {
    const callbacks = makeAccountCallbacks(this.props.dispatch)
    return !this.props.context.listUsernames ? null : (
      <LoginScreen
        username={this.props.username}
        accountOptions={{callbacks}}
        context={this.props.context}
        onLogin={this.onLogin}
        key={this.state.key.toString()}
      />
    )
  }
}

const mapStateToProps = (state) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state)
})
const mapDispatchToProps = (dispatch) => ({
  dispatch,
  initializeAccount: (account) => dispatch(initializeAccount(account))
})

export default connect(mapStateToProps, mapDispatchToProps)(Login)
