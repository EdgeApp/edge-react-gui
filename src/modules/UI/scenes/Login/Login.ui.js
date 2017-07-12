import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ActivityIndicator, Alert, Button, Image, InteractionManager, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
// import styles from './styles.js'
import LinearGradient from 'react-native-linear-gradient'
import Modal from 'react-native-modal'
import { makeContext } from 'airbitz-core-js'
import { getUsersList } from '../../components/ControlPanel/action.js'

const Logo = require('../../../../img/logo2x.png')

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  logo: {
    alignSelf: 'center',
    width: 200
  },
  textInput: {
    height: 40,
    margin: 15,
    padding: 3,
    paddingLeft: 10,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1,
  },
  button: {
    alignSelf: 'flex-end',
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  modal: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInner: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    borderColor: 'black',
    borderWidth: 1
  },
  modalText: {
    margin: 10
  },
  spinner: {
    margin: 10
  },
})

class Login extends Component {
  constructor (props) {
    super(props)

    this.state = {
      username: 'bob2',
      password: 'bob2',
      loggingInModalVisible: false,
      animating: true,
      incorrectPassword: false,
      shouldLogin: false
    }
  }

  render () {
    InteractionManager.runAfterInteractions(this.login)

    return (
      <LinearGradient
        style={styles.background}
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}>

        <View style={styles.view}>
          <Modal
            style={styles.modal}
            animationType={'fade'}
            transparent
            visible={this.state.loggingInModalVisible}>

            <View style={styles.modalInner}>
              <Text style={styles.modalText}>Logging in...</Text>
              <ActivityIndicator
                animating={this.state.animating}
                style={styles.spinner}
              />
            </View>

          </Modal>

          <Image source={Logo} style={styles.logo} resizeMode={'contain'}/>
          <TextInput
            style={styles.textInput}
            onChangeText={this.updateUsername}
            value={this.state.username}
          />
          <TextInput
            secureTextEntry
            style={styles.textInput}
            onChangeText={this.updatePassword}
            value={this.state.password}
          />
          <TouchableOpacity style={styles.button} onPress={this.onPress}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>

      </LinearGradient>
    )
  }

  updateUsername = username => this.setState({username})
  updatePassword = password => this.setState({password})

  onPress = () => {
    this.setState({
      loggingInModalVisible: true,
      shouldLogin: true,
    })
  }

  login = () => {
    if (!this.state.shouldLogin) { return }
    console.log('logging in')

    const { username, password } = this.state
    const { callbacks } = this.props

    this.props.context.loginWithPassword(
      username,
      password,
      null,
      callbacks
    )
    .then(account => {
      getListUsernames(this.props.context, this.props.dispatch)
      this.setState({
        loggingInModalVisible: false,
        shouldLogin: false,
      })
      this.props.onLoggedIn(account)
    })
    // .catch(error => {
    //   this.setState({
    //     loggingInModalVisible: false,
    //     shouldLogin: false,
    //   }, console.log(error))
    // })
  }

}

export default connect()(Login)

const getListUsernames = (context, dispatch) => {

  context.listUsernames((error, usernames) => {
    return dispatch(getUsersList(usernames))
  })

}
