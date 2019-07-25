// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import * as Animatable from 'react-native-animatable'
import CookieManager from 'react-native-cookies'
import { WebView } from 'react-native-webview'
import { base64 } from 'rfc4648'

import ENV from '../../../env.json'
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
  componentDidMount () {
    CookieManager.clearAll().then(res => {
      console.log('CookieManager.clearAll =>', res)
    })
  }
  onNavigate = (navstate: Object) => {
    if (navstate.url.startsWith('https://developer.airbitz.co/shapeshift-auth')) {
      const code = navstate.url.replace('https://developer.airbitz.co/shapeshift-auth?code=', '')
      this.setState({ code })
      this.getToken(code)
    }
  }
  getToken = async (code: string) => {
    const { clientId: id = '3a49c306-8c52-42a2-b7cf-bda4e4aa6d7d', secret = 'CWmm11jKoayEGPptfLzkyrrmyVHAG1skzRQuKJZYBrhy' } = ENV.SHAPESHIFT_INIT
    const text = id + ':' + secret
    const data = new Uint8Array(text.length)
    for (let i = 0; i < text.length; ++i) data[i] = text.charCodeAt(i)
    const basic = 'Basic ' + base64.stringify(data)
    const method = 'POST'
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: basic
    }
    const body = JSON.stringify({
      code: code,
      grant_type: 'authorization_code'
    })

    try {
      let parsed: string
      if (global.androidFetch) {
        const response = await global.androidFetch('https://auth.shapeshift.io/oauth/token', {
          method,
          headers,
          body
        })
        parsed = JSON.parse(response)
      } else {
        const response = await fetch('https://auth.shapeshift.io/oauth/token', {
          method,
          headers,
          body
        })
        if (response.status !== 200) {
          Alert.alert(s.strings.kyc_something_wrong, s.strings.kyc_something_wrong_message, [{ text: s.strings.string_ok, onPress: this.props.onDone }])
          return
        }
        parsed = await response.json()
      }
      this.props.setToken(parsed, this.props.pluginName)
      this.props.onDone()
    } catch (error) {
      Alert.alert(s.strings.kyc_something_wrong, s.strings.kyc_something_wrong_message, [{ text: s.strings.string_ok, onPress: this.props.onDone }])
    }
  }
  setRef = (ref: WebView = null) => {
    this.ref = ref
  }

  render () {
    // const { onDone } = this.props
    if (this.state.code === null) {
      return (
        <Animatable.View style={styles.topLevel} animation="fadeInUp" duration={250}>
          <SafeAreaView>
            <View style={styles.container}>
              <Gradient style={styles.gradient}>
                <BackButton onPress={this.props.onDone} label={s.strings.title_back} withArrow />
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
