import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Dispatch } from '../../types/reduxTypes'
import { NavigationBase } from '../../types/routerTypes'
import { ModalButtons } from '../buttons/ModalButtons'
import { showError, showToast } from '../services/AirshipInstance'
import { ThemeProps, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { EdgeModal } from './EdgeModal'

interface OwnProps {
  bridge: AirshipBridge<void>
  navigation: NavigationBase
}

interface StateProps {
  account: EdgeAccount
}

interface DispatchProps {
  dispatch: Dispatch
}

interface State {
  errorMessage?: string
  password: string
  checkingPassword: boolean
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class PasswordReminderModalComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { checkingPassword: false, password: '' }
  }

  handleCancel = () => {
    if (!this.state.checkingPassword) {
      this.props.dispatch({ type: 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED' })
      this.props.bridge.resolve()
    }
  }

  handleRequestChangePassword = () => {
    if (!this.state.checkingPassword) {
      this.props.bridge.resolve()
      this.props.dispatch({ type: 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD' })
      setTimeout(() => this.props.navigation.navigate('changePassword', {}), 10)
    }
  }

  handleSubmit = async () => {
    const { bridge, account } = this.props
    const { password } = this.state

    const isValidPassword = await account.checkPassword(password).catch(err => showError(err))
    if (isValidPassword) {
      this.props.dispatch({ type: 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS' })
      this.setState({ checkingPassword: false })
      showToast(lstrings.password_reminder_great_job)
      setTimeout(() => bridge.resolve(), 10)
    } else {
      this.setState({ errorMessage: lstrings.password_reminder_invalid, checkingPassword: false })
    }
  }

  handleChangeText = (password: string) => this.setState({ password })

  render() {
    const { bridge } = this.props
    const { errorMessage, password, checkingPassword } = this.state

    return (
      <EdgeModal bridge={bridge} title={lstrings.password_reminder_modal_title} onCancel={this.handleCancel}>
        <Paragraph>{lstrings.password_reminder_modal_body}</Paragraph>
        <ModalFilledTextInput
          autoFocus={false}
          error={errorMessage}
          placeholder={lstrings.password}
          onChangeText={this.handleChangeText}
          onSubmitEditing={this.handleSubmit}
          secureTextEntry
          value={password}
        />
        <ModalButtons
          primary={{ label: lstrings.password_reminder_check_password, onPress: this.handleSubmit, disabled: password.length === 0 }}
          secondary={{ label: lstrings.password_reminder_forgot_password, onPress: this.handleRequestChangePassword, disabled: checkingPassword }}
        />
      </EdgeModal>
    )
  }
}

export function PasswordReminderModal(props: OwnProps): JSX.Element {
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)

  return <PasswordReminderModalComponent {...props} account={account} dispatch={dispatch} theme={theme} />
}
