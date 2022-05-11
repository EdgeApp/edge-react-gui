// @flow

import Clipboard from '@react-native-clipboard/clipboard'
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { B } from '../../styles/common/textStyles.js'
import { config } from '../../theme/appConfig.js'
import { connect } from '../../types/reactRedux.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { Airship, showError, showToast } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { MainButton } from '../themed/MainButton.js'

type StateProps = {
  account: EdgeAccount
}
type Props = StateProps & ThemeProps

type State = {
  otpKey?: string,
  showKey: boolean
}

class OtpSettingsSceneComponent extends React.Component<Props, State> {
  cleanups: Array<() => mixed> | void

  constructor(props: Props) {
    super(props)
    const { account } = props
    this.state = {
      otpKey: account.otpKey,
      showKey: false
    }
  }

  componentDidMount() {
    const { account } = this.props
    this.cleanups = [account.watch('otpKey', otpKey => this.setState({ otpKey }))]
  }

  componentWillUnmount() {
    if (this.cleanups != null) this.cleanups.forEach(f => f())
  }

  handleDisable = (): void => {
    const { account } = this.props

    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.otp_modal_headline}
        message={s.strings.otp_modal_body}
        buttons={{
          ok: {
            label: s.strings.otp_disable,
            async onPress() {
              await account.disableOtp()
              return true
            }
          },
          cancel: { label: s.strings.string_cancel_cap }
        }}
      />
    )).catch(showError)
  }

  handleEnable = async (): Promise<void> => {
    const { account } = this.props
    await account.enableOtp()
  }

  handleToggleKey = (): void => {
    this.setState(state => ({ showKey: !state.showKey }))
  }

  handleCopyKey = () => {
    const { otpKey = '' } = this.state
    Clipboard.setString(otpKey)
    showToast(s.strings.otp_copied_msg)
  }

  render() {
    const { theme } = this.props
    const { otpKey } = this.state
    const styles = getStyles(theme)
    const otpDescriptionTwo = sprintf(s.strings.otp_description_two, config.appName)

    return (
      <SceneWrapper background="theme" padding={theme.rem(0.5)} scroll>
        <AntDesignIcon name="lock" style={styles.icon} />
        <Text style={styles.titleText}>{otpKey != null ? s.strings.title_otp_enabled : s.strings.title_otp_disabled}</Text>

        <Text style={styles.messageText}>{s.strings.otp_description}</Text>
        <Text style={styles.messageText}>{otpDescriptionTwo}</Text>
        {otpKey != null ? (
          <Text style={styles.messageText}>
            <B>{s.strings.otp_enabled_message}</B>
          </Text>
        ) : null}

        {otpKey != null ? this.renderKey(otpKey) : null}
        {otpKey != null ? (
          <MainButton label={s.strings.otp_disable} marginRem={0.5} type="secondary" onPress={this.handleDisable} />
        ) : (
          <MainButton label={s.strings.otp_enable} marginRem={0.5} type="secondary" onPress={this.handleEnable} />
        )}
      </SceneWrapper>
    )
  }

  renderKey(otpKey: string) {
    const { theme } = this.props
    const { showKey } = this.state
    const styles = getStyles(theme)

    return (
      <View style={styles.keyArea}>
        <TouchableOpacity style={styles.keyToggle} onPress={this.handleToggleKey}>
          <Text style={styles.keyToggleText}>{showKey ? s.strings.otp_hide_code : s.strings.otp_show_code}</Text>
          <AntDesignIcon name={showKey ? 'up' : 'down'} style={styles.keyToggleIcon} />
        </TouchableOpacity>
        {showKey ? (
          <TouchableOpacity onPress={this.handleCopyKey}>
            <Text style={styles.keyText}>{otpKey}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  scrollContainer: {
    padding: theme.rem(0.5)
  },
  icon: {
    alignSelf: 'center',
    color: theme.primaryText,
    fontSize: theme.rem(2),
    margin: theme.rem(0.5)
  },
  titleText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.25),
    margin: theme.rem(0.5),
    textAlign: 'center'
  },
  messageText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5),
    textAlign: 'left'
  },
  keyArea: {
    backgroundColor: theme.tileBackground,
    borderRadius: theme.rem(0.5),
    margin: theme.rem(0.5),
    padding: theme.rem(0.5)
  },
  keyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  keyToggleText: {
    color: theme.primaryText,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5)
  },
  keyToggleIcon: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5)
  },
  keyText: {
    color: theme.textLink,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'center',
    textDecorationLine: 'underline',
    margin: theme.rem(0.5)
  }
}))

export const OtpSettingsScene = connect<StateProps, {}, {}>(
  state => ({
    account: state.core.account
  }),
  dispatch => ({})
)(withTheme(OtpSettingsSceneComponent))
