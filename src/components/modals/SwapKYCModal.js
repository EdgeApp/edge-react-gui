// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Alert, View, WebView } from 'react-native'
import * as Animatable from 'react-native-animatable'

import s from '../../locales/strings'
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
  }
  getToken = async (code: string) => {
    try {
      let response
      if (global.androidFetch) {
        response = await global.androidFetch('https://auth.shapeshift.io/oauth/token', {
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
      } else {
        response = await fetch('https://auth.shapeshift.io/oauth/token', {
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
      }
      if (response.status !== 200) {
        Alert.alert(s.strings.kyc_something_wrong, s.strings.kyc_something_wrong_message, [{ text: 's.strings.string_ok', onPress: this.props.onDone }])
        return
      }
      const parsed = JSON.parse(response._bodyText)
      this.props.setToken(parsed, this.props.pluginName)
    } catch (error) {
      Alert.alert(s.strings.kyc_something_wrong, s.strings.kyc_something_wrong_message, [{ text: 's.strings.string_ok', onPress: this.props.onDone }])
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
                  userAgent={
                    'Mozilla/5.0 (Linux; Android 6.0.1; SM-G532G Build/MMB29T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.83 Mobile Safari/537.36'
                  }
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
