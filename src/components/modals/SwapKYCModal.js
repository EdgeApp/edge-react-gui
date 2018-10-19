// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Button, Text, View, WebView } from 'react-native'
import * as Animatable from 'react-native-animatable'

import { SwapKYCModalStyles as styles } from '../../styles/components/SwapKYCModalStyles'

export type Props = {
  showKYCAlert: boolean,
  onDone(): mixed,
  setToken({
    accessToken: string,
    refreshToken: string
  }): void
}
type State = { code: string | null }
class SwapKYCModal extends Component<Props, State> {
  ref: { current: null | WebView }

  constructor (props: Props) {
    super(props)
    this.state = { code: null }
  }
  goBack = () => {
    console.log('BACK')
    // The ref allows us to call methods on the WebView component:
    const webView = this.ref.current
    if (webView != null) {
      webView.goBack()
    }
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
      this.props.setToken(parsed)
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
        <Animatable.View style={[styles.topLevel, { position: 'absolute', top: 0, height: '100%' }]} animation="fadeInUp" duration={250}>
          <View style={styles.container}>
            <Text>{'\nTesting Shapeshift React Native'}</Text>
            <Button onPress={this.goBack} title="back" />
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
