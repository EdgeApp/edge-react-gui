import Clipboard from '@react-native-clipboard/clipboard'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { B } from '../../styles/common/textStyles'
import { config } from '../../theme/appConfig'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'

interface OwnProps extends EdgeSceneProps<'otpSetup'> {}

interface StateProps {
  account: EdgeAccount
}
type Props = OwnProps & StateProps & ThemeProps

interface State {
  otpKey?: string
  showKey: boolean
}

class OtpSettingsSceneComponent extends React.Component<Props, State> {
  cleanups: Array<() => unknown> | undefined

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

    Airship.show<'ok' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        // @ts-expect-error
        bridge={bridge}
        title={lstrings.otp_modal_headline}
        message={lstrings.otp_modal_body}
        buttons={{
          ok: {
            label: lstrings.otp_disable,
            async onPress() {
              await account.disableOtp()
              logActivity(`2FA Disable: ${account.username}`)
              return true
            }
          },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      />
    )).catch(showError)
  }

  handleEnable = async (): Promise<void> => {
    const { account } = this.props
    await account.enableOtp()
    logActivity(`2FA Enable: ${account.username}`)
  }

  handleToggleKey = (): void => {
    this.setState(state => ({ showKey: !state.showKey }))
  }

  handleCopyKey = () => {
    const { otpKey = '' } = this.state
    Clipboard.setString(otpKey)
    showToast(lstrings.otp_copied_msg)
  }

  render() {
    const { theme } = this.props
    const { otpKey } = this.state
    const styles = getStyles(theme)
    const otpDescriptionTwo = sprintf(lstrings.otp_description_two, config.appName)

    return (
      <SceneWrapper background="theme" padding={theme.rem(0.5)} scroll>
        <AntDesignIcon name="lock" style={styles.icon} />
        <Text style={styles.titleText}>{otpKey != null ? lstrings.title_otp_enabled : lstrings.title_otp_disabled}</Text>

        <Text style={styles.messageText}>{lstrings.otp_description}</Text>
        <Text style={styles.messageText}>{otpDescriptionTwo}</Text>
        {otpKey != null ? (
          <Text style={styles.messageText}>
            <B>{lstrings.otp_enabled_message}</B>
          </Text>
        ) : null}

        {otpKey != null ? this.renderKey(otpKey) : null}
        {otpKey != null ? (
          <MainButton label={lstrings.otp_disable} marginRem={0.5} type="secondary" onPress={this.handleDisable} />
        ) : (
          <MainButton label={lstrings.otp_enable} marginRem={0.5} type="secondary" onPress={this.handleEnable} />
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
          <Text style={styles.keyToggleText}>{showKey ? lstrings.otp_hide_code : lstrings.otp_show_code}</Text>
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

export const OtpSettingsScene = connect<StateProps, {}, OwnProps>(
  state => ({
    account: state.core.account
  }),
  dispatch => ({})
)(withTheme(OtpSettingsSceneComponent))
