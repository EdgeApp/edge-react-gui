// @flow

import React, { Component } from 'react'
import { View, WebView } from 'react-native'

import Gradient from '../../modules/UI/components/Gradient/Gradient.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { styles } from '../../styles/scenes/TermsOfServiceStyle.js'

const WEB_URI = 'https://edge.app/tos/'

export type TermsOfServiceOwnProps = {}

export type TermsOfServiceProps = TermsOfServiceOwnProps

export class TermsOfServiceComponent extends Component<TermsOfServiceProps> {
  render () {
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <WebView style={styles.webView} source={{ uri: WEB_URI }} />
        </View>
      </SafeAreaView>
    )
  }
}
