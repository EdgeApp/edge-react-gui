// @flow
import React, { Component } from 'react'
import { Image, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import { KYCAlertModalStyles as styles } from '../../styles/indexStyles'

export type Props = {
  onDone(): mixed,
  logo: { uri: string },
  aboutText: string,
  acceptText: string,
  termsText: string,
  privacyText: string,
  amlText: string,
  onAccept(): void,
  termsClick(): void,
  privacyClick(): void,
  amlClick(): void
}
type State = {}

class KYCAlertModal extends Component<Props, State> {
  onAccept = () => {
    this.props.onAccept()
    this.props.onDone()
  }
  render () {
    return (
      <View style={styles.container}>
        <View style={styles.modalBox}>
          <View style={styles.innerBox}>
            <LinearGradient style={styles.header} start={styles.gradientStart} end={styles.gradientEnd} colors={styles.gradientColors}>
              <Image source={this.props.logo} style={styles.logoImage} />
            </LinearGradient>
            <View style={styles.bottom}>
              <View style={styles.bodyRow}>
                <T style={styles.headerText} isBold>
                  {this.props.aboutText}
                </T>
                <T style={styles.bodyText}>{this.props.acceptText}</T>
                <PrimaryButton style={styles.button} onPress={this.onAccept}>
                  <PrimaryButton.Text>{s.strings.accept_button_text}</PrimaryButton.Text>
                </PrimaryButton>
                <View style={styles.bodyRow2}>
                  <Text style={styles.bodyTextLink} onPress={this.props.termsClick}>
                    {this.props.termsText}
                  </Text>
                  <Text style={styles.bodyTextLink} onPress={this.props.privacyClick}>
                    {this.props.privacyText}
                  </Text>
                  <Text style={styles.bodyTextLink} onPress={this.props.amlClick}>
                    {this.props.amlText}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
export { KYCAlertModal }

// eslint-disable-next-line
export const createKYCAlertModal = (opts: Object) => (props: { +onDone: Function }) => {
  return (
    <KYCAlertModal
      logo={opts.logo}
      aboutText={opts.aboutText}
      onDone={props.onDone}
      acceptText={opts.acceptText}
      termsText={opts.termsText}
      privacyText={opts.privacyText}
      amlText={opts.amlText}
      onAccept={opts.onAccept}
      termsClick={opts.termsClick}
      privacyClick={opts.privacyClick}
      amlClick={opts.amlClick}
    />
  )
}
