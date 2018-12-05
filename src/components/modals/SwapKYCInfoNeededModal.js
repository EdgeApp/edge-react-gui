// @flow

import React, { Component } from 'react'
import { Image, Linking, View } from 'react-native'
import * as Animatable from 'react-native-animatable'

// import ENV from '../../../env.json'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import BackButton from '../../modules/UI/components/Header/Component/BackButton.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView'
import { SwapKYCInfoNeededStyles as styles } from '../../styles/indexStyles'

export type Props = {
  onDone(): mixed,
  closeFinishKYCModal(): void,
  pluginName: string
}
type State = {}

export class SwapKYCInfoNeededModal extends Component<Props, State> {
  goBack = () => {
    this.props.closeFinishKYCModal()
    this.props.onDone()
  }

  renderImage = () => {
    switch (this.props.pluginName) {
      case 'ShapeShift':
      case 'shapeshift':
        return { uri: 'exchange_logo_shapeshift' }

      case 'bitaccess':
        return { uri: 'exchange_logo_bitaccess' }

      case 'changenow':
        return { uri: 'exchange_logo_changenow' }

      case 'changelly':
      default:
        return { uri: 'exchange_logo_changelly' }
    }
  }

  goToUrl = () => {
    let url = ''
    switch (this.props.pluginName) {
      case 'ShapeShift':
      case 'shapeshift':
        url = 'https://ShapeShift.io'
        break
      default:
        url = 'https://ShapeShift.io'
    }
    Linking.openURL(url)
  }

  renderText = () => {
    switch (this.props.pluginName) {
      case 'ShapeShift':
      case 'shapeshift':
        return s.strings.ss_need_more_kyc
      case 'bitaccess':
      case 'changenow':
      case 'changelly':
      default:
        return ''
    }
  }
  render () {
    return (
      <Animatable.View style={styles.topLevel} animation="fadeInUp" duration={250}>
        <SafeAreaView>
          <Gradient style={styles.scene}>
            <Gradient style={styles.gradient}>
              <BackButton onPress={this.goBack} label={s.strings.title_back} withArrow />
            </Gradient>
            <View style={styles.topRow}>
              <Image source={this.renderImage()} style={styles.logoImage} />
            </View>
            <View style={styles.centerRow}>
              <T style={styles.bodyText}>{this.renderText()}</T>
            </View>
            <View style={styles.bottomRow}>
              <View style={styles.actionButtonContainer}>
                <PrimaryButton onPress={this.goToUrl}>
                  <PrimaryButton.Text>{s.strings.ss_visit_website}</PrimaryButton.Text>
                </PrimaryButton>
              </View>
            </View>
          </Gradient>
        </SafeAreaView>
      </Animatable.View>
    )
  }
}
