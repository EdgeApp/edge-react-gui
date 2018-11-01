// @flow

import { createStaticModal, createYesNoModal, showModal } from 'edge-components'
import React, { Component } from 'react'
import { Image, Text, View } from 'react-native'

import iconImage from '../../assets/images/otp/OTP-badge_sm.png'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton, TertiaryButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { OtpSettingsScreenStyles } from '../../styles/indexStyles.js'
import OtpHeroComponent from '../common/OtpHeroComponent.js'
import { ExpandableBoxComponent, StaticModalComponent } from '../indexComponents.js'

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
  messageModalComponent?: any
}

export default class OtpSettingsScene extends Component<OtpSettingsSceneProps, State> {
  UNSAFE_componentWillMount () {
    this.setState({
      showMessageModal: false,
      messageModalMessage: ''
    })
  }

  cancelStatic = () => {
    this.setState({
      showMessageModal: false,
      messageModalMessage: ''
    })
  }

  onPressDisable = async () => {
    // Use `showModal` to put the modal component on screen:
    const confirmDisableModal = createYesNoModal({
      title: s.strings.otp_modal_headline,
      message: s.strings.otp_modal_body,
      icon: <Image source={iconImage} />,
      yesButtonText: s.strings.otp_disable,
      noButtonText: s.strings.string_cancel_cap
    })

    const resolveValue = await showModal(confirmDisableModal)
    if (resolveValue) {
      this.props.disableOtp()
      this.onConfirmDisable()
    }
  }

  onConfirmDisable = async () => {
    const styles = OtpSettingsScreenStyles
    const afterDisableModal = createStaticModal({
      message: s.strings.otp_disabled_modal,
      icon: <Icon style={styles.icon} name={Constants.CHECK_CIRCLE} size={styles.iconSize} type={Constants.SIMPLE_ICONS} />,
      modalDismissTimerSeconds: 8
    })

    await showModal(afterDisableModal)
  }

  onPressEnable = () => {
    this.setState(
      {
        showMessageModal: true,
        messageModalMessage: null,
        messageModalComponent: (
          <Text style={{ textAlign: 'center' }}>
            <T>
              {s.strings.otp_enabled_modal_part_one} <T isBold>{s.strings.otp_enabled_modal_part_two}</T>
            </T>
          </Text>
        )
      },
      this.props.enableOtp
    )
  }

  renderButton = () => {
    if (this.props.isOtpEnabled) {
      return (
        <TertiaryButton onPress={this.onPressDisable}>
          <TertiaryButton.Text>{s.strings.otp_disable}</TertiaryButton.Text>
        </TertiaryButton>
      )
    }
    return (
      <PrimaryButton onPress={this.onPressEnable}>
        <PrimaryButton.Text>{s.strings.otp_enable}</PrimaryButton.Text>
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

  render () {
    const styles = OtpSettingsScreenStyles
    console.log('this.state.showMessageModal: ', this.state.showMessageModal)
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Gradient style={styles.gradient} />
          <View style={styles.body}>
            <OtpHeroComponent style={styles.hero} enabled={this.props.isOtpEnabled} />
            {this.renderMiddle(styles)}
            <View style={styles.buttonContainer}>{this.renderButton()}</View>
          </View>
        </View>
        <StaticModalComponent
          cancel={this.cancelStatic}
          body={this.state.messageModalMessage}
          bodyComponent={this.state.messageModalComponent}
          isVisible={this.state.showMessageModal}
          modalDismissTimerSeconds={10}
        />
      </SafeAreaView>
    )
  }
}
