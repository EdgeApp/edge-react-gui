// @flow

import { createInputModal } from 'edge-components'
import React, { Component } from 'react'
// eslint-disable-next-line react-native/split-platform-components
import { FlatList, Image, PermissionsAndroid, Platform, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { updateOneSetting } from '../../actions/SettingsActions.js'
import {
  ANDROID,
  ARROW_RIGHT,
  COUNTRY_CODES,
  EDGE_PLUGIN_REGIONS,
  FLAG_LOGO_URL,
  PLUGIN_BUY,
  PLUGIN_BUY_LEGACY,
  PLUGIN_SPEND,
  PLUGIN_SPEND_LEGACY,
  SIMPLE_ICONS,
  SPEND
} from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { getSyncedSettingsAsync, setSyncedSettingsAsync } from '../../modules/Core/Account/settings.js'
import Text from '../../modules/UI/components/FormattedText'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { buySellPlugins, spendPlugins } from '../../modules/UI/scenes/Plugins/plugins'
import styles from '../../styles/scenes/PluginsStyle.js'
import { THEME, colors } from '../../theme/variables/airbitz.js'
import type { BuySellPlugin } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { CountrySelectionModal } from '../modals/CountrySelectionModal.js'
import { SimpleConfirmationModal } from '../modals/SimpleConfirmationModal.js'
import { Airship } from '../services/AirshipInstance.js'

type Props = {
  developerModeOn: boolean,
  account: Object,
  updateCountryCode: ({ [string]: mixed }) => void,
  countryCode: string,
  title?: string
}

type State = {
  data: Array<Object>
}

const MODAL_DATA_FILE = 'pluginModalTracker.json'

class PluginList extends Component<Props, State> {
  isSpendModal: boolean

  constructor (props) {
    super(props)
    this.isSpendModal = false
    this.state = { data: [] }
  }

  async componentDidMount () {
    await this.checkDisclaimer()
    if (!this.isSpendModal) this.checkCountry()
  }

  /**
   * Verify that we have shown the disclaimer
   */
  async checkDisclaimer () {
    const { account } = this.props
    try {
      const text = await account.disklet.getText(MODAL_DATA_FILE)
      const data = JSON.parse(text)
      const timesPluginWarningModalViewed = data.viewed
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
      const obj = {
        viewed: 1
      }
      const text = JSON.stringify(obj)
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
      console.log('custom click!')

      const yesButton = {
        title: s.strings.load_plugin
      }
      const noButton = {
        title: s.strings.string_cancel_cap
      }
      const input = {
        label: s.strings.plugin_url,
        autoCorrect: false,
        returnKeyType: 'go',
        initialValue: '',
        autoFocus: true
      }
      const modal = createInputModal({
        icon: (
          <IonIcon
            name="md-globe"
            size={42}
            color={colors.primary}
            style={[
              {
                backgroundColor: THEME.COLORS.TRANSPARENT,
                zIndex: 1015,
                elevation: 1015
              }
            ]}
          />
        ),
        title: s.strings.load_plugin,
        input,
        yesButton,
        noButton
      })
      launchModal(modal).then(response => {
        if (response) {
          plugin.uri = response
        }
        const key = Actions.currentScene === SPEND ? PLUGIN_SPEND : PLUGIN_BUY
        console.log('pvs: key', key)
        Actions[key]({ plugin: plugin })
      })
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

  openPlugin = (plugin: BuySellPlugin) => {
    if (Actions.currentScene === SPEND) {
      const key = plugin.isLegacy ? PLUGIN_SPEND_LEGACY : PLUGIN_SPEND
      Actions[key]({ plugin: plugin })
      return
    }
    const key = plugin.isLegacy ? PLUGIN_BUY_LEGACY : PLUGIN_BUY
    Actions[key]({ plugin: plugin })
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
        updateCountryCode({ countryCode: selectedCountryCode })
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
    const { countryCode, title } = this.props
    const { data } = this.state
    const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === countryCode)
    let countryName = s.strings.buy_sell_crypto_select_country_button
    let filename = ''
    let filteredPlugins = data
    if (countryData) {
      countryName = countryData.name
      filename = countryData.filename ? countryData.filename : countryData.name.toLowerCase().replace(' ', '-')
      filteredPlugins = data.filter(plugin => {
        return (
          // needed because "Spend" scene doesn't have a plugins JSON currently
          plugin &&
          (plugin.pluginId === 'custom' ||
            // there is a title (buy or sell) and you can use it to find its country codes
            ((title &&
              plugin.name &&
              EDGE_PLUGIN_REGIONS[title][plugin.name.toLowerCase()] &&
              EDGE_PLUGIN_REGIONS[title][plugin.name.toLowerCase()].countryCodes[countryCode]) ||
              // there is no title (buy or sell) and therefore you use the 'buy' option
              (!title &&
                plugin.name &&
                EDGE_PLUGIN_REGIONS.buy[plugin.name.toLowerCase()] &&
                EDGE_PLUGIN_REGIONS.buy[plugin.name.toLowerCase()].countryCodes[countryCode])))
        )
      })
    }
    const logoUrl = `${FLAG_LOGO_URL}/${filename}.png`

    return (
      <SceneWrapper background="body" hasTabs={false}>
        {this.isSpendModal || (
          <View style={styles.selectedCountryWrapper}>
            <TouchableWithoutFeedback style={styles.selectedCountry} onPress={this.openCountrySelectionModal}>
              <View style={styles.selectedCountryTextWrapper}>
                <View style={{ flexDirection: 'row' }}>
                  {!!countryData && <Image source={{ uri: logoUrl }} style={{ height: scale(30), width: scale(30), borderRadius: scale(15) }} />}
                  <Text style={{ fontSize: scale(16), alignSelf: 'center', paddingLeft: 12 }}>{countryName}</Text>
                </View>
                <Icon type={SIMPLE_ICONS} style={{ alignSelf: 'center' }} name={ARROW_RIGHT} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
        {!!countryCode && filteredPlugins.length === 0 ? (
          <View style={{ flex: 1, width: '100%', padding: scale(50), justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ textAlign: 'center' }}>{s.strings.buy_sell_crypto_no_plugin_region}</Text>
          </View>
        ) : (
          <FlatList data={filteredPlugins} renderItem={this._renderPlugin} keyExtractor={item => item.name} />
        )}
      </SceneWrapper>
    )
  }
}

class PluginBuySellComponent extends PluginList {
  componentDidMount () {
    const { title, developerModeOn } = this.props
    super.componentDidMount()
    const pluginsList = buySellPlugins(developerModeOn, title)
    this.setState({
      data: pluginsList
    })
  }
}

class PluginSpendComponent extends PluginList {
  componentDidMount () {
    this.isSpendModal = true
    super.componentDidMount()
    this.setState({
      data: spendPlugins(this.props.developerModeOn)
    })
  }
}

const listMapStateToProps = state => {
  const developerModeOn = state.ui.settings.developerModeOn
  return {
    developerModeOn,
    countryCode: state.ui.settings.countryCode,
    account: state.core.account
  }
}

const listMapDispatchToProps = dispatch => ({
  updateCountryCode: (countryCode: { [mixed]: any }) => dispatch(updateOneSetting(countryCode))
})

const PluginBuySell = connect(
  listMapStateToProps,
  listMapDispatchToProps
)(PluginBuySellComponent)

const PluginSpend = connect(
  listMapStateToProps,
  listMapDispatchToProps
)(PluginSpendComponent)

export { PluginBuySell, PluginSpend }
