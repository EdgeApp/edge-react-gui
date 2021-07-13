// @flow

import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import { YellowBox } from 'react-native'

import ENV from '../../env.json'
import { checkEnabledExchanges } from '../actions/CryptoExchangeActions.js'
import { registerDevice } from '../actions/DeviceIdActions.js'
import { logoutRequest } from '../actions/LoginActions.js'
import { checkAndShowGetCryptoModal } from '../actions/ScanActions.js'
import { showReEnableOtpModal } from '../actions/SettingsActions.js'
import { WalletListScene } from '../components/scenes/WalletListScene.js'
import { requestPermission } from '../components/services/PermissionsManager.js'
import {
  EXCHANGE_QUOTE_SCENE,
  EXCHANGE_SCENE,
  FIO_ADDRESS_REGISTER,
  FIO_ADDRESS_REGISTER_SELECT_WALLET,
  LOGIN,
  PLUGIN_VIEW,
  WALLET_LIST_SCENE
} from '../constants/SceneKeys.js'
import s from '../locales/strings.js'
import { ifLoggedIn } from '../modules/UI/components/LoginStatus/LoginStatus.js'
import { type Permission } from '../reducers/PermissionsReducer.js'
import { connect } from '../types/reactRedux.js'
import { Actions } from '../types/routerTypes.js'
import { logEvent } from '../util/tracking.js'
import { AirshipToast } from './common/AirshipToast.js'
import { BackButton } from './navigation/BackButton.js'
import { EdgeLogoHeader } from './navigation/EdgeLogoHeader.js'
import { handlePluginBack } from './navigation/GuiPluginBackButton.js'
import { LoginScene } from './scenes/LoginScene.js'
import { Airship } from './services/AirshipInstance.js'

type DispatchProps = {
  registerDevice: () => void,

  // Navigation actions:
  logout: (username?: string) => void,

  // Things to do when we enter certain scenes:
  checkAndShowGetCryptoModal: (selectedWalletId?: string, selectedCurrencyCode?: string) => void,
  checkEnabledExchanges: () => void,
  dispatchDisableScan: () => void,
  dispatchEnableScan: () => void,
  requestPermission: (permission: Permission) => void,
  showReEnableOtpModal: () => void
}

type Props = DispatchProps

const Stack = createStackNavigator()

export class MainComponent extends React.Component<Props> {
  backPressedOnce: boolean

  constructor(props: Props) {
    super(props)

    if (ENV.HIDE_IS_MOUNTED) {
      YellowBox.ignoreWarnings([
        'Warning: isMounted(...) is deprecated',
        'Module RCTImageLoader',
        'The scalesPageToFit property is not supported when useWebKit = true'
      ])
    }
  }

  componentDidMount() {
    logEvent('AppStart')
    this.props.registerDevice()
  }

  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LOGIN">
          <Stack.Screen
            name="login"
            component={LoginScene}
            options={{
              headerShown: false
            }}
          />
          <Stack.Screen
            name="walletListScene"
            component={ifLoggedIn(WalletListScene)}
            options={{
              header: EdgeLogoHeader
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    )
  }

  renderEmptyButton = () => {
    return <BackButton isEmpty onPress={this.handleEmpty} />
  }

  isCurrentScene = (sceneKey: string) => {
    return Actions.currentScene === sceneKey
  }

  handleEmpty = () => null

  handleBack = () => {
    if (this.isCurrentScene(LOGIN)) {
      return false
    }
    if (this.isCurrentScene(WALLET_LIST_SCENE)) {
      if (this.backPressedOnce) {
        this.props.logout()
      } else {
        this.backPressedOnce = true
        Airship.show(bridge => <AirshipToast bridge={bridge} message={s.strings.back_button_tap_again_to_exit} />).then(() => {
          this.backPressedOnce = false
        })
      }
      return true
    }
    if (this.isCurrentScene(EXCHANGE_QUOTE_SCENE)) {
      Actions.popTo(EXCHANGE_SCENE)
      return true
    }
    if (this.isCurrentScene(PLUGIN_VIEW)) {
      handlePluginBack()
      return true
    }
    if (this.isCurrentScene(FIO_ADDRESS_REGISTER)) {
      if (Actions.currentParams.noAddresses) {
        Actions.jump(WALLET_LIST_SCENE)
        return true
      }
    }
    if (this.isCurrentScene(FIO_ADDRESS_REGISTER_SELECT_WALLET)) {
      if (Actions.currentParams.isFallback) {
        Actions.popTo(FIO_ADDRESS_REGISTER)
        return true
      }
    }
    Actions.pop()
    return true
  }
}

export const Main = connect<{}, DispatchProps, {}>(
  state => ({}),
  dispatch => ({
    registerDevice() {
      dispatch(registerDevice())
    },

    // Navigation actions:
    logout(username?: string): void {
      dispatch(logoutRequest(username))
    },

    // Things to do when we enter certain scenes:
    checkAndShowGetCryptoModal(selectedWalletId?: string, selectedCurrencyCode?: string) {
      dispatch(checkAndShowGetCryptoModal(selectedWalletId, selectedCurrencyCode))
    },
    checkEnabledExchanges() {
      dispatch(checkEnabledExchanges())
    },
    dispatchDisableScan() {
      dispatch({ type: 'DISABLE_SCAN' })
    },
    dispatchEnableScan() {
      dispatch({ type: 'ENABLE_SCAN' })
    },
    requestPermission(permission: Permission) {
      requestPermission(permission)
    },
    showReEnableOtpModal() {
      dispatch(showReEnableOtpModal())
    }
  })
)(MainComponent)
