// @flow
import React, {Component} from 'react'
import { View, Text } from 'react-native'
import {OtpSettingsScreenStyles} from '../../../../styles/indexStyles.js'
import Gradient from '../../components/Gradient/Gradient.ui.js'
import OtpHeroComponent from './OtpHeroComponent.js'
import SafeAreaView from '../../components/SafeAreaView'
import {PrimaryButton, TertiaryButton} from '../../components/Buttons/index'
import s from '../../../../locales/strings.js'
import {StaticModalComponent, TwoButtonTextModalComponent, ExpandableBoxComponent} from '../../../../components/indexComponents.js'
import * as Constants from '../../../../constants/indexConstants.js'
import iconImage from '../../../../assets/images/otp/OTP-badge_sm.png'
type Props = {
  isOtpEnabled: boolean,
  otpKey?: string,
  otpResetDate?: string,
  enableOtp(): void,
  disableOtp(): void,
  keepOtp(): void
}

type State = {
  showMessageModal: boolean,
  messageModalMessage?: string,
  showConfirmationModal: boolean,
  showResetDialog: boolean
}

export default class OtpSettingsSceneComponent extends Component<Props, State> {
  componentWillMount () {
    let showResetDialog = false
    if (this.props.otpResetDate) {
      showResetDialog = true
    }
    this.setState({
      showMessageModal: false,
      messageModalMessage: '',
      showConfirmationModal: false,
      showResetDialog
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
      messageModalMessage: s.strings.otp_enabled_modal_part_one + '' + s.strings.otp_enabled_modal_part_two
    })
    this.props.enableOtp()
  }

  disableOtp = () => {
    this.setState({
      showMessageModal: true,
      messageModalMessage: s.strings.otp_disabled_modal,
      showConfirmationModal: false,
      showResetDialog: false
    })
    this.props.disableOtp()
  }

  keepOtp = () => {
    this.setState({
      showResetDialog: false
    })
    this.props.keepOtp()
  }

  renderButton = () => {
    if (this.props.isOtpEnabled) {
      return <TertiaryButton text={s.strings.otp_disable} onPressFunction={this.onPress} />
    }
    return <PrimaryButton text={s.strings.otp_enable} onPressFunction={this.onPress} />
  }
  renderKeyBox = (styles: Object) => {
    if (this.props.isOtpEnabled) {
      return <ExpandableBoxComponent
        style={styles.keyBox}
        showMessage={s.strings.otp_show_code}
        hideMessage={s.strings.otp_hide_code} >
        <Text style={styles.keyText}>{this.props.otpKey}</Text>
      </ExpandableBoxComponent>
    }
    return null
  }
  renderMiddle (styles: Object) {
    const message = this.props.isOtpEnabled ? s.strings.otp_enabled_description : s.strings.otp_description
    return <View style={styles.middle} >
            <Text style={styles.middleText}>{message}</Text>
            <View style={styles.shim} />
            {this.renderKeyBox(styles)}
          </View>
  }
  renderModals (styles: Object) {
    if (this.state.showMessageModal) {
      return <StaticModalComponent
        cancel={this.cancelStatic}
        body={this.state.messageModalMessage}
        modalDismissTimerSeconds={4} />
    }
    if (this.state.showConfirmationModal) {
      return <TwoButtonTextModalComponent
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
    }
    if (this.state.showResetDialog) {
      return <TwoButtonTextModalComponent
        style={styles.showConfirmationModal}
        headerText={s.strings.otp_modal_reset_headline}
        showModal
        middleText={''}
        iconImage={iconImage}
        cancelText={s.strings.otp_disable}
        doneText={s.strings.otp_keep}
        onCancel={this.disableOtp}
        onDone={this.keepOtp}
      />
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
            <OtpHeroComponent style={styles.hero}
              enabled={this.props.isOtpEnabled} />
            {this.renderMiddle(styles)}
            <View style={styles.buttonContainer} >
              {this.renderButton()}
            </View>
          </View>
          {this.renderModals(styles)}
        </View>
      </SafeAreaView>
    )
  }
}
