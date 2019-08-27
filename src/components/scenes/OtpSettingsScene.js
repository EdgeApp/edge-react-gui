// @flow

import { createStaticModal, createYesNoModal } from 'edge-components'
import React, { Component, Fragment } from 'react'
import { Clipboard, Image, Text, TouchableOpacity, View } from 'react-native'

import iconImage from '../../assets/images/otp/OTP-badge_sm.png'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton, TertiaryButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { styles } from '../../styles/scenes/OtpSettingsScreenStyles.js'
import { launchModal } from '../common/ModalProvider.js'
import OtpHeroComponent from '../common/OtpHeroComponent.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ExpandableBoxComponent, StaticModalComponent } from '../indexComponents.js'
import { showToast } from '../services/AirshipInstance.js'

type Props = {
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

export default class OtpSettingsScene extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      showMessageModal: false,
      messageModalMessage: ''
    }
  }

  cancelStatic = () => {
    this.setState({
      showMessageModal: false,
      messageModalMessage: ''
    })
  }

  onPressDisable = async () => {
    // Use `launchModal` to put the modal component on screen:
    const confirmDisableModal = createYesNoModal({
      title: s.strings.otp_modal_headline,
      message: s.strings.otp_modal_body,
      icon: <Image source={iconImage} />,
      yesButtonText: s.strings.otp_disable,
      noButtonText: s.strings.string_cancel_cap
    })

    const resolveValue = await launchModal(confirmDisableModal)
    if (resolveValue) {
      this.props.disableOtp()
      this.onConfirmDisable()
    }
  }

  onConfirmDisable = async () => {
    const afterDisableModal = createStaticModal({
      message: s.strings.otp_disabled_modal,
      icon: <Icon style={styles.icon} name={Constants.CHECK_CIRCLE} size={styles.iconSize} type={Constants.SIMPLE_ICONS} />,
      modalDismissTimerSeconds: 8
    })

    await launchModal(afterDisableModal)
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

  onCopyOtpKey = () => {
    Clipboard.setString(this.props.otpKey)
    showToast(s.strings.otp_copied_msg)
  }

  renderKeyBox = (styles: Object) => {
    if (this.props.isOtpEnabled) {
      return (
        <ExpandableBoxComponent style={styles.keyBox} showMessage={s.strings.otp_show_code} hideMessage={s.strings.otp_hide_code}>
          <TouchableOpacity onPress={this.onCopyOtpKey}>
            <Text style={styles.keyText}>{this.props.otpKey}</Text>
          </TouchableOpacity>
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
    console.log('this.state.showMessageModal: ', this.state.showMessageModal)
    return (
      <Fragment>
        <SceneWrapper hasTabs={false} background="body">
          <View style={styles.body}>
            <OtpHeroComponent style={styles.hero} enabled={this.props.isOtpEnabled} />
            {this.renderMiddle(styles)}
            <View style={styles.buttonContainer}>{this.renderButton()}</View>
          </View>
        </SceneWrapper>
        <StaticModalComponent
          cancel={this.cancelStatic}
          body={this.state.messageModalMessage || ''}
          bodyComponent={this.state.messageModalComponent}
          isVisible={this.state.showMessageModal}
          modalDismissTimerSeconds={10}
        />
      </Fragment>
    )
  }
}
