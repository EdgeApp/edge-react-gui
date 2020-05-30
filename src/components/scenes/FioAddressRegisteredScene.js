// @flow

import React, { Component } from 'react'
import { Alert, Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/SceneKeys'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { styles as mainStyles } from '../../styles/MainStyle'
import { styles } from '../../styles/scenes/FioAddressDetailsStyle'
import { SceneWrapper } from '../common/SceneWrapper'

export type NavProps = {
  fioAddressName: string,
  expiration: string,
  feeCollected: number,
  navigation: any
}

type Props = NavProps

export class FioAddressRegisteredScene extends Component<Props> {
  componentDidMount() {
    const { fioAddressName } = this.props
    if (!fioAddressName) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }
    this.props.navigation.setParams({
      renderTitle: this.renderTitle(fioAddressName)
    })
  }

  renderTitle = (title: string) => {
    return (
      <View style={styles.titleWrapper}>
        <T style={mainStyles.titleStyle}>{title}</T>
      </View>
    )
  }

  renderButton() {
    return (
      <View style={styles.buttons}>
        <TouchableHighlight style={styles.bottomButton} onPress={Actions[Constants.FIO_ADDRESS_LIST]} underlayColor={styles.underlay.color}>
          <View style={styles.bottomButtonTextWrap}>
            <T style={styles.bottomButtonText}>{s.strings.fio_address_list}</T>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  render() {
    const { fioAddressName, expiration } = this.props
    return (
      <SceneWrapper>
        <View style={styles.view}>
          <View style={styles.texts}>
            <View style={styles.image}>
              <Image source={fioAddressDetailsIcon} />
            </View>
            <T style={styles.text}>{s.strings.fio_address_details_screen_registered}</T>
            <T style={styles.title}>{fioAddressName}</T>
            <T style={styles.text}>
              {`${s.strings.fio_address_details_screen_expires} `}
              {intl.formatExpDate(expiration)}
            </T>
          </View>
          {this.renderButton()}
        </View>
      </SceneWrapper>
    )
  }
}
