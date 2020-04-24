// @flow

import React, { Component } from 'react'
import { Alert, Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/SceneKeys'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import { styles } from '../../styles/scenes/FioAddressDetailsStyle'
import { SceneWrapper } from '../common/SceneWrapper'

export type State = {}

export type StateProps = {
  fioAddressName: string,
  expiration: Date,
  registerSuccess?: boolean
}

export type SceneProps = {
  fioAddress: string
}

type Props = StateProps & SceneProps

export class FioAddressDetailsScene extends Component<Props, State> {
  componentDidMount () {
    const { fioAddress } = this.props

    if (!fioAddress) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }
  }

  _onToggleConnectWallets = (): void => {
    const { fioAddressName } = this.props
    Actions[Constants.FIO_CONNECT_TO_WALLETS]({ fioAddressName })
  }

  _onToggleAccountSettings = () => {
    const { fioAddressName, expiration } = this.props
    Actions[Constants.FIO_ACCOUNT_SETTINGS]({ fioAddressName, expiration: intl.formatExpDate(expiration) })
  }

  renderButton () {
    if (this.props.registerSuccess) {
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

    return (
      <View style={styles.buttons}>
        <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleAccountSettings} underlayColor={styles.underlay.color}>
          <View style={styles.bottomButtonTextWrap}>
            <T style={styles.bottomButtonText}>{s.strings.fio_address_details_screen_manage_account_settings}</T>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleConnectWallets} underlayColor={styles.underlay.color}>
          <View style={[styles.bottomButtonTextWrap, styles.buttonWithLoader]}>
            <T style={styles.bottomButtonText}>{s.strings.fio_address_details_screen_connect_to_wallets}</T>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  render () {
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
