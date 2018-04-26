// @flow

import React, { Component } from 'react'
import { Platform, View, Text, Alert, Clipboard } from 'react-native'
import s from '../../../../../../locales/strings.js'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import {PrimaryButton} from '../../../../components/Buttons/Buttons.ui'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { colors } from '../../../../../../theme/variables/airbitz.js'
import styles from './style.js'

type XPubModalOwnProps = {

}

type XPubModalStateProps = {
  xPubKeySyntax: string,
  visibilityBoolean: boolean,
}

type XPubModalDispatchProps = {
  onExit: () => void
}

type XPubModalState = {

}

type XPubModalComponentProps = XPubModalOwnProps & XPubModalStateProps & XPubModalDispatchProps

export default class XPubModal extends Component<XPubModalComponentProps, XPubModalState> {
  _onPressCopy = () => {
    try {
      Clipboard.setString(this.props.xPubKeySyntax)
      Alert.alert(
        s.strings.fragment_wallets_pubkey_copied_title,
        s.strings.fragment_wallets_pubkey_copied_success,
        [{
          text: s.strings.string_ok, onPress: () => this.props.onExit()
        }]
      )
    } catch (e) {
      console.log('Error:', e.title, e.message)
      Alert.alert('Error', s.strings.fragment_wallets_pubkey_copied_error)
    }
  }

  render () {
    const osPrefix = Platform.OS === 'ios' ? 'ios-' : 'md-'
    const icon = <IonIcon name={`${osPrefix}eye`} size={24} color={colors.primary} style={styles.icon} />
    return (
      <StylizedModal
        headerText={s.strings.fragment_wallets_view_xpub_key}
        featuredIcon={icon}
        visibilityBoolean={this.props.visibilityBoolean}
        modalMiddle={<Text style={styles.xPubKeySyntax}>{this.props.xPubKeySyntax}</Text>}
        modalBottom={this.renderButtons()}
        onExitButtonFxn={this.props.onExit}
        onPressFunction={this._onPressCopy}
      />
    )
  }

  renderButtons = () => {
    return (
      <View style={styles.doneButtonWrap}>
        <PrimaryButton text={s.strings.fragment_request_copy_title} textStyle={styles.doneButton} onPressFunction={this._onPressCopy} />
      </View>
    )
  }
}
