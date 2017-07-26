import React, {Component} from 'react'
import {connect} from 'react-redux'
import {
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Button,
  Image,
  InteractionManager,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  findNodeHandle
} from 'react-native'
// import styles from './styles.js'
import LinearGradient from 'react-native-linear-gradient'
import Modal from 'react-native-modal'
import {makeContext} from 'airbitz-core-js'
import {getUsersList} from '../../components/ControlPanel/action.js'
import { BlurView, VibrancyView } from 'react-native-blur';

const Logo = require('../../../../img/edge_logo_3x.png')

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 50
  },
  logo: {
    alignSelf: 'center',
    width: 150
  },
  textInput: {
    height: 45,
    margin: 10,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 4,
    color: 'rgba(1, 1, 1, .5)'
  },
  button: {
    alignSelf: 'stretch',
    height: 45,
    margin: 10,
    marginTop: 50,
    marginBottom: 45,
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4
  },
  buttonText: {
    color: 'rgba(1, 100, 255, 1)',
    fontFamily: 'Gill Sans',
    fontSize: 18
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
  },
  modal: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

  },
  modalInner: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    borderRadius: 4
  },
  modalText: {
    margin: 10,
    color: 'rgba(1, 100, 255, 1)',
    fontFamily: 'Gill Sans',
    fontSize: 18
  },
  spinner: {
    margin: 10
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  absolute: {
    position: "absolute",
    top: 0, left: 0, bottom: 0, right: 0,
  },
})

class Login extends Component {
  constructor(props) {
    super(props)

    this.state = {
      username: 'edgy3',
      password: 'Test123456',
      loggingInModalVisible: false,
      animating: true,
      incorrectPassword: false,
      shouldLogin: false,
      viewRef: '',
      blurAmount: 10
    }
  }

  componentDidMount () {
    this.setState({
      viewRef: findNodeHandle(this.blurItem)
    })
  }

  render() {
    InteractionManager.runAfterInteractions(this.login)

    return (
      <LinearGradient style={styles.background} start={{
        x: 0,
        y: 0,
      }} end={{
        x: 1,
        y: 0,
      }} colors={['#3b7adb', '#2b569a',]}>

        <Modal style={styles.modal} animationType={'fade'} transparent visible={this.state.loggingInModalVisible}>
          <View style={styles.modalInner}>
            <Text style={styles.modalText}>Signing in...</Text>
            <ActivityIndicator size={'large'} animating={this.state.animating} style={styles.spinner}/>
          </View>
        </Modal>

        <KeyboardAvoidingView style={styles.view} behavior={'padding'}>

          <View style={styles.blur} ref={(blurItem) => { this.blurItem = blurItem }}>
            <Image source={Logo}
              style={styles.logo}
              resizeMode={'contain'} />
            <TextInput placeholder={'username'} keyboardShouldPersistTaps={'always'} autoCorrect={false} autoFocus style={styles.textInput} onChangeText={this.updateUsername} value={this.state.username}/>
            <TextInput placeholder={'password'} keyboardShouldPersistTaps={'always'} secureTextEntry style={styles.textInput} onChangeText={this.updatePassword} value={this.state.password}/>
            <TouchableOpacity style={styles.button} onPress={this.onPress}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          { this.state.shouldBlur &&
            <BlurView style={styles.absolute}
              viewRef={this.state.viewRef}
              blurType="dark"
              blurAmount={this.state.blurAmount} />}

        </KeyboardAvoidingView>

      </LinearGradient>
    )
  }

  updateUsername = username => this.setState({username})
  updatePassword = password => this.setState({password})

  onPress = () => {
    this.setState({
      loggingInModalVisible: true,
      shouldLogin: true,
      shouldBlur: true
    })
  }

  login = () => {
    if (!this.state.shouldLogin) {
      return
    }
    console.log('logging in')

    const {username, password,} = this.state
    const {callbacks} = this.props

    this.props.context.loginWithPassword(username, password, null, callbacks).then(account => {
      getListUsernames(this.props.context, this.props.dispatch)
      this.setState({loggingInModalVisible: false, shouldLogin: false})
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
