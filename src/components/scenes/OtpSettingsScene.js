// @flow

import { createStaticModal, createYesNoModal } from 'edge-components'
import React, { Component } from 'react'
import { Clipboard, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import iconImage from '../../assets/images/otp/OTP-badge_sm.png'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { TertiaryButton } from '../../modules/UI/components/Buttons/TertiaryButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { ExpandableBoxStyle } from '../../styles/components/ExpandableBoxStyle.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { ExpandableBoxComponent } from '../common/ExpandableBoxComponent.js'
import { launchModal } from '../common/ModalProvider.js'
import OtpHeroComponent from '../common/OtpHeroComponent.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { StaticModalComponent } from '../modals/StaticModalComponent.js'
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
  constructor(props: Props) {
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
      icon: <Icon style={styles.icon} name={Constants.CHECK_CIRCLE} size={scale(36)} type={Constants.SIMPLE_ICONS} />,
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
        <ExpandableBoxComponent style={ExpandableBoxStyle} showMessage={s.strings.otp_show_code} hideMessage={s.strings.otp_hide_code}>
          <TouchableOpacity onPress={this.onCopyOtpKey}>
            <Text style={styles.keyText}>{this.props.otpKey}</Text>
          </TouchableOpacity>
        </ExpandableBoxComponent>
      )
    }
    return null
  }

  renderMiddle(styles: Object) {
    const message = this.props.isOtpEnabled ? s.strings.otp_enabled_description : s.strings.otp_description
    return (
      <View style={styles.middle}>
        <Text style={styles.middleText}>{message}</Text>
        <View style={styles.shim} />
        {this.renderKeyBox(styles)}
      </View>
    )
  }

  render() {
    console.log('this.state.showMessageModal: ', this.state.showMessageModal)
    return (
      <>
        <SceneWrapper hasTabs={false} background="body">
          <View style={styles.body}>
            <OtpHeroComponent enabled={this.props.isOtpEnabled} />
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
      </>
    )
  }
}

const rawStyles = {
  body: {
    backgroundColor: THEME.COLORS.WHITE,
    flex: 1,
    padding: scale(18)
  },
  shim: {
    height: scale(10)
  },
  middle: {
    width: '100%',
    minHeight: scale(200)
  },
  middleText: {
    width: '100%',
    fontSize: scale(18),
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.GRAY_2
  },
  keyText: {
    width: '100%',
    fontSize: scale(18),
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.ACCENT_BLUE,
    textDecorationLine: 'underline'
  },
  buttonContainer: {
    width: '100%',
    height: scale(THEME.BUTTONS.HEIGHT)
  },
  icon: {
    color: THEME.COLORS.WHITE
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
