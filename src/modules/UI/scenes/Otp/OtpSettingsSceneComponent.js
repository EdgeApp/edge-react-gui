// @flow

import React, { Component } from 'react'
import { Text, View } from 'react-native'

import iconImage from '../../../../assets/images/otp/OTP-badge_sm.png'
import { ExpandableBoxComponent, StaticModalComponent, TwoButtonTextModalComponent } from '../../../../components/indexComponents.js'
import * as Constants from '../../../../constants/indexConstants.js'
import s from '../../../../locales/strings.js'
import { OtpSettingsScreenStyles } from '../../../../styles/indexStyles.js'
import { PrimaryButton, TertiaryButton } from '../../components/Buttons/index'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui.js'
import SafeAreaView from '../../components/SafeAreaView'
import OtpHeroComponent from './OtpHeroComponent.js'

type OtpSettingsSceneProps = {
  isOtpEnabled: boolean,
  otpKey?: string,
  otpResetDate?: string,
  enableOtp(): void,
  disableOtp(): void
}

type State = {
  showMessageModal: boolean,
  messageModalMessage: string | null,
  messageModalComponent?: any,
  showConfirmationModal: boolean
}

export default class OtpSettingsScene extends Component<OtpSettingsSceneProps, State> {
  UNSAFE_componentWillMount () {
    this.setState({
      showMessageModal: false,
      messageModalMessage: '',
      showConfirmationModal: false
    })
  }
  cancelStatic = () => {
    this.setState({
      showMessageModal: false,
      messageModalMessage: ''
    })
  }
  cancelConfirmModal = () => {
    this.setState({
      showConfirmationModal: false
    })
  }
  onPress = () => {
    if (this.props.isOtpEnabled) {
      this.setState({
        showConfirmationModal: true
      })
      return
    }
    this.setState({
      showMessageModal: true,
      messageModalMessage: null,
      messageModalComponent: (
        <Text style={{ textAlign: 'center' }}>
          <T>
            {s.strings.otp_enabled_modal_part_one} <T isBold>{s.strings.otp_enabled_modal_part_two}</T>
          </T>
        </Text>
      )
    })
    this.props.enableOtp()
  }

  disableOtp = () => {
    this.setState({
      showMessageModal: true,
      messageModalMessage: s.strings.otp_disabled_modal,
      showConfirmationModal: false,
      messageModalComponent: null
    })
    this.props.disableOtp()
  }

  renderButton = () => {
    if (this.props.isOtpEnabled) {
      return (
        <TertiaryButton onPress={this.onPress}>
          <TertiaryButton.Text>{s.strings.otp_disable}</TertiaryButton.Text>
        </TertiaryButton>
      )
    }
    return (
      <PrimaryButton onPress={this.onPress}>
        <PrimaryButton.Text>{s.strings.otp_disable}</PrimaryButton.Text>
      </PrimaryButton>
    )
  }
  renderKeyBox = (styles: Object) => {
    if (this.props.isOtpEnabled) {
      return (
        <ExpandableBoxComponent style={styles.keyBox} showMessage={s.strings.otp_show_code} hideMessage={s.strings.otp_hide_code}>
          <Text style={styles.keyText}>{this.props.otpKey}</Text>
        </ExpandableBoxComponent>
      )
    }
    return null
  }
  renderMiddle (styles: Object) {
    const message = this.props.isOtpEnabled ? s.strings.otp_enabled_description : s.strings.otp_description
    return (
      <View style={styles.middle}>
        <Text style={styles.middleText}>{message}</Text>
        <View style={styles.shim} />
        {this.renderKeyBox(styles)}
      </View>
    )
  }
  renderModals (styles: Object) {
    if (this.state.showConfirmationModal) {
      return (
        <TwoButtonTextModalComponent
          style={styles.showConfirmationModal}
          headerText={s.strings.otp_modal_headline}
          showModal
          middleText={s.strings.otp_modal_body}
          icon={Constants.SWAP_HORIZ}
          iconImage={iconImage}
          cancelText={s.strings.string_cancel_cap}
          doneText={s.strings.otp_disable}
          onCancel={this.cancelConfirmModal}
          onDone={this.disableOtp}
        />
      )
    }
    return null
  }
  render () {
    const styles = OtpSettingsScreenStyles
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Gradient style={styles.gradient} />
          <View style={styles.body}>
            <OtpHeroComponent style={styles.hero} enabled={this.props.isOtpEnabled} />
            {this.renderMiddle(styles)}
            <View style={styles.buttonContainer}>{this.renderButton()}</View>
          </View>
          {this.renderModals(styles)}
        </View>
        <StaticModalComponent
          cancel={this.cancelStatic}
          body={this.state.messageModalMessage}
          bodyComponent={this.state.messageModalComponent}
          isVisible={this.state.showMessageModal}
          modalDismissTimerSeconds={8}
        />
      </SafeAreaView>
    )
  }
}
