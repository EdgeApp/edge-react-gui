// @flow

import React, { Component } from 'react'
import { ActivityIndicator, View, WebView } from 'react-native'
import * as Animatable from 'react-native-animatable'

import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import BackButton from '../../modules/UI/components/Header/Component/BackButton.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView'
import { SwapKYCModalStyles as styles } from '../../styles/components/SwapKYCModalStyles'

export type Props = {
  showKYCAlert: boolean,
  pluginName: string,
  onDone(): mixed,
  setToken(
    {
      accessToken: string,
      refreshToken: string
    },
    string
  ): void
}
type State = { code: string | null }
class SwapKYCModal extends Component<Props, State> {
  ref: { current: null | WebView }

  constructor (props: Props) {
    super(props)
    this.state = { code: null }
  }
  onNavigate = (navstate: Object) => {
    if (navstate.url.startsWith('https://developer.airbitz.co/shapeshift-auth')) {
      const code = navstate.url.replace('https://developer.airbitz.co/shapeshift-auth?code=', '')
      this.setState({ code })
      this.getToken(code)
    }
    console.log(navstate)
  }
  getToken = async (code: string) => {
    console.log(code)
    try {
      const response = await fetch('https://auth.shapeshift.io/oauth/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Basic M2E0OWMzMDYtOGM1Mi00MmEyLWI3Y2YtYmRhNGU0YWE2ZDdkOkNXbW0xMWpLb2F5RUdQcHRmTHpreXJybXlWSEFHMXNrelJRdUtKWllCcmh5'
        },
        body: JSON.stringify({
          code: code,
          grant_type: 'authorization_code'
        })
      })
      const parsed = JSON.parse(response._bodyText)
      this.props.setToken(parsed, this.props.pluginName)
    } catch (error) {
      console.error(error)
    }
  }
  setRef = (ref: WebView = null) => {
    this.ref = ref
  }
  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (!nextProps.showKYCAlert) {
      this.props.onDone()
    }
  }
  render () {
    // const { onDone } = this.props
    if (this.state.code === null) {
      return (
        <Animatable.View style={styles.topLevel} animation="fadeInUp" duration={250}>
          <SafeAreaView>
            <View style={styles.container}>
              <Gradient style={styles.gradient}>
                <BackButton onPress={this.props.onDone} label="back" />
              </Gradient>
              <View style={styles.webview}>
                <WebView
                  ref={this.setRef}
                  source={{
                    uri:
                      'https://auth.shapeshift.io/oauth/authorize?response_type=code&scope=users%3Aread&client_id=3a49c306-8c52-42a2-b7cf-bda4e4aa6d7d&redirect_uri=https%3A%2F%2Fdeveloper.airbitz.co%2Fshapeshift-auth'
                  }}
                  onNavigationStateChange={this.onNavigate}
                />
              </View>
            </View>
          </SafeAreaView>
        </Animatable.View>
      )
    }
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    )
  }
}
export { SwapKYCModal }
