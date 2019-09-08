// @flow

import { createInputModal } from 'edge-components'
import { type EdgeAccount } from 'edge-core-js/types'
import React, { Component } from 'react'
// eslint-disable-next-line react-native/split-platform-components
import { FlatList, Image, PermissionsAndroid, Platform, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { updateOneSetting } from '../../actions/SettingsActions.js'
import { ANDROID, ARROW_RIGHT, COUNTRY_CODES, FLAG_LOGO_URL, PLUGIN_VIEW, PLUGIN_VIEW_LEGACY, SIMPLE_ICONS } from '../../constants/indexConstants.js'
import { allPlugins, buyPluginFilter, buySellPluginFilter, devPlugin, sellPluginFilter } from '../../constants/plugins/buySellPlugins.js'
import s from '../../locales/strings.js'
import { getSyncedSettingsAsync, setSyncedSettingsAsync } from '../../modules/Core/Account/settings.js'
import Text from '../../modules/UI/components/FormattedText'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import styles from '../../styles/scenes/PluginsStyle.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type BuySellFilter, type BuySellPlugin, type CountryData } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { CountrySelectionModal } from '../modals/CountrySelectionModal.js'
import { SimpleConfirmationModal } from '../modals/SimpleConfirmationModal.js'
import { Airship } from '../services/AirshipInstance.js'

type OwnProps = {
  direction?: 'buy' | 'sell'
}

type StateProps = {
  account: EdgeAccount,
  countryCode: string,
  developerModeOn: boolean
}

type DispatchProps = {
  updateCountryCode(string): void
}

type Props = OwnProps & StateProps & DispatchProps

const MODAL_DATA_FILE = 'pluginModalTracker.json'

class PluginList extends Component<Props> {
  async componentDidMount () {
    await this.checkDisclaimer()
    this.checkCountry()
  }

  /**
   * Verify that we have shown the disclaimer
   */
  async checkDisclaimer () {
    const { account } = this.props
    try {
      const text = await account.disklet.getText(MODAL_DATA_FILE)
      const json = JSON.parse(text)
      const timesPluginWarningModalViewed = json.viewed
      if (timesPluginWarningModalViewed < 3) {
        const newNumber = timesPluginWarningModalViewed + 1
        if (newNumber === 3) {
          await Airship.show(bridge => (
            <SimpleConfirmationModal bridge={bridge} text={s.strings.plugin_provider_disclaimer} buttonText={s.strings.string_ok_cap} />
          ))
        }
        const newText = JSON.stringify({
          viewed: newNumber
        })
        await account.disklet.setText(MODAL_DATA_FILE, newText)
      }
    } catch (e) {
      const json = {
        viewed: 1
      }
      const text = JSON.stringify(json)
      await account.disklet.setText(MODAL_DATA_FILE, text)
      await Airship.show(bridge => <SimpleConfirmationModal bridge={bridge} text={s.strings.plugin_provider_disclaimer} buttonText={s.strings.string_ok_cap} />)
    }
  }

  /**
   * Verify that we have a country selected
   */
  async checkCountry () {
    const { countryCode } = this.props
    if (!countryCode) this.openCountrySelectionModal()
  }

  _onPress = (plugin: BuySellPlugin) => {
    const { pluginId, permissions = [] } = plugin
    if (pluginId === 'custom') {
      this.openCustomPlugin(plugin)
      return
    }
    if (permissions.length > 0) {
      if (Platform.OS === ANDROID) {
        this.requestAndroidPermissions(permissions, plugin)
        return
      }
    }
    this.openPlugin(plugin)
  }

  requestAndroidPermissions = async (permissionList: Array<string>, plugin: BuySellPlugin) => {
    let reqType
    switch (permissionList[0]) {
      case 'camera':
        reqType = PermissionsAndroid.PERMISSIONS.CAMERA
        break
      default:
        reqType = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    }
    try {
      const request = reqType
      const granted = await PermissionsAndroid.request(request, {})
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.openPlugin(plugin)
      } else {
        this.openPlugin(plugin)
      }
    } catch (err) {
      console.warn(err)
    }
  }

  openCustomPlugin (plugin: BuySellPlugin) {
    const modal = createInputModal({
      icon: <IonIcon name="md-globe" size={42} color={THEME.COLORS.SECONDARY} />,
      title: s.strings.load_plugin,
      input: {
        label: s.strings.plugin_url,
        autoCorrect: false,
        returnKeyType: 'go',
        initialValue: plugin.uri,
        autoFocus: true
      },
      yesButton: { title: s.strings.load_plugin },
      noButton: { title: s.strings.string_cancel_cap }
    })
    launchModal(modal).then(response => {
      plugin.uri = response
      Actions[PLUGIN_VIEW]({ plugin })
    })
  }

  openPlugin = (plugin: BuySellPlugin) => {
    const key = plugin.isLegacy ? PLUGIN_VIEW_LEGACY : PLUGIN_VIEW
    Actions[key]({ plugin })
  }

  openCountrySelectionModal = async () => {
    const { account, updateCountryCode, countryCode } = this.props

    const selectedCountryCode: string = await Airship.show(bridge => <CountrySelectionModal bridge={bridge} countryCode={countryCode} />)
    if (selectedCountryCode) {
      try {
        const syncedSettings = await getSyncedSettingsAsync(account)
        const updatedSettings = {
          ...syncedSettings,
          countryCode: selectedCountryCode
        }
        updateCountryCode(selectedCountryCode)
        await setSyncedSettingsAsync(account, updatedSettings)
      } catch (e) {
        console.log(e)
        throw new Error(s.strings.settings_set_country_code_error)
      }
    }
  }

  _renderPlugin = ({ item }) => (
    <TouchableWithoutFeedback onPress={() => this._onPress(item)}>
      <View style={styles.pluginRow}>
        <View style={styles.logo}>{item.imageUrl && <Image style={styles.logoImage} source={{ uri: item.imageUrl }} />}</View>
        <View style={styles.textBoxWrap}>
          <Text style={styles.titleText}>{item.name}</Text>
          <Text style={styles.subtitleText}>{item.subtitle}</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )

  render () {
    const { countryCode, developerModeOn, direction } = this.props
    const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === countryCode)

    // Pick a filter based on our direction:
    const filter: BuySellFilter = direction === 'buy' ? buyPluginFilter : direction === 'sell' ? sellPluginFilter : buySellPluginFilter

    // Remove plugins that don't exist in the filter:
    let plugins = allPlugins.filter((plugin: BuySellPlugin) => filter[plugin.name.toLowerCase()] != null)

    // Remove plugins that don't match our country:
    if (countryData != null) {
      plugins = plugins.filter((plugin: BuySellPlugin) => plugin.pluginId === 'custom' || filter[plugin.name.toLowerCase()].countryCodes[countryCode])
    }

    // Sort the plugins:
    plugins.sort((a: BuySellPlugin, b: BuySellPlugin) => {
      const aPriority = filter[a.name.toLowerCase()].priority
      const bPriority = filter[b.name.toLowerCase()].priority
      return aPriority - bPriority
    })

    // Add the dev mode plugin if enabled:
    if (developerModeOn) {
      plugins = [...plugins, devPlugin]
    }

    return (
      <SceneWrapper background="body" hasTabs={false}>
        {this.renderCountryPicker(countryData)}
        {plugins.length === 0 ? (
          <View style={{ flex: 1, width: '100%', padding: scale(50), justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ textAlign: 'center' }}>{s.strings.buy_sell_crypto_no_plugin_region}</Text>
          </View>
        ) : (
          <FlatList data={plugins} renderItem={this._renderPlugin} keyExtractor={(item: BuySellPlugin) => item.pluginId} />
        )}
      </SceneWrapper>
    )
  }

  renderCountryPicker (countryData: CountryData | void) {
    let flag = null
    let message = s.strings.buy_sell_crypto_select_country_button
    if (countryData != null) {
      const { filename = countryData.name.toLowerCase().replace(' ', '-') } = countryData

      flag = <Image source={{ uri: `${FLAG_LOGO_URL}/${filename}.png` }} style={{ height: scale(30), width: scale(30), borderRadius: scale(15) }} />
      message = countryData.name
    }

    return (
      <View style={styles.selectedCountryWrapper}>
        <TouchableWithoutFeedback style={styles.selectedCountry} onPress={this.openCountrySelectionModal}>
          <View style={styles.selectedCountryTextWrapper}>
            <View style={{ flexDirection: 'row' }}>
              {flag}
              <Text style={{ fontSize: scale(16), alignSelf: 'center', paddingLeft: 12 }}>{message}</Text>
            </View>
            <Icon type={SIMPLE_ICONS} style={{ alignSelf: 'center' }} name={ARROW_RIGHT} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }
}

export const PluginListScene = connect(
  (state: ReduxState): StateProps => ({
    developerModeOn: state.ui.settings.developerModeOn,
    countryCode: state.ui.settings.countryCode,
    account: state.core.account
  }),
  (dispatch: Dispatch): DispatchProps => ({
    updateCountryCode (countryCode: string) {
      dispatch(updateOneSetting({ countryCode }))
    }
  })
)(PluginList)
