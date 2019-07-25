// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import * as Animatable from 'react-native-animatable'
import CookieManager from 'react-native-cookies'
import { WebView } from 'react-native-webview'

import s from '../../locales/strings'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import BackButton from '../../modules/UI/components/Header/Component/BackButton.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView'
import { SwapKYCModalStyles as styles } from '../../styles/components/SwapKYCModalStyles'

type Props = {
  onDone(): mixed,
  activateShapeShift(oauthCode: string): Promise<mixed>
}

type State = { working: boolean }

export class SwapKYCModal extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { working: false }
  }

  componentDidMount () {
    CookieManager.clearAll()
  }

  onNavigate = async (navstate: Object) => {
    if (navstate.url.startsWith('https://developer.airbitz.co/shapeshift-auth')) {
      const code = navstate.url.replace('https://developer.airbitz.co/shapeshift-auth?code=', '')
      this.setState({ working: true })

      try {
        await this.props.activateShapeShift(code)
      } catch (e) {
        Alert.alert(s.strings.kyc_something_wrong, s.strings.kyc_something_wrong_message, [{ text: s.strings.string_ok, onPress: this.props.onDone }])
      }
      this.props.onDone()
    }
  }

  render () {
    if (this.state.working) {
      return (
        <View style={styles.container}>
          <ActivityIndicator />
        </View>
      )
    }

    return (
      <Animatable.View style={styles.topLevel} animation="fadeInUp" duration={250}>
        <SafeAreaView>
          <View style={styles.container}>
            <Gradient style={styles.gradient}>
              <BackButton onPress={this.props.onDone} label={s.strings.title_back} withArrow />
            </Gradient>
            <View style={styles.webview}>
              <WebView
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
}
