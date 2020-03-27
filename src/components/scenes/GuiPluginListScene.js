// @flow

import AsyncStorage from '@react-native-community/async-storage'
import { asObject, asString } from 'cleaners'
import { createInputModal } from 'edge-components'
import { type EdgeAccount } from 'edge-core-js/types'
import React, { Component } from 'react'
import { FlatList, Image, Platform, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { updateOneSetting } from '../../actions/SettingsActions.js'
import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import paymentTypeLogoBankgirot from '../../assets/images/paymentTypes/paymentTypeLogoBankgirot.png'
import paymentTypeLogoBankTransfer from '../../assets/images/paymentTypes/paymentTypeLogoBankTransfer.png'
import paymentTypeLogoCash from '../../assets/images/paymentTypes/paymentTypeLogoCash.png'
import paymentTypeLogoCreditCard from '../../assets/images/paymentTypes/paymentTypeLogoCreditCard.png'
import paymentTypeLogoFasterPayments from '../../assets/images/paymentTypes/paymentTypeLogoFasterPayments.png'
import paymentTypeLogoGiftCard from '../../assets/images/paymentTypes/paymentTypeLogoGiftCard.png'
import paymentTypeLogoIdeal from '../../assets/images/paymentTypes/paymentTypeLogoIdeal.png'
import paymentTypeLogoNewsagent from '../../assets/images/paymentTypes/paymentTypeLogoNewsagent.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoSwish from '../../assets/images/paymentTypes/paymentTypeLogoSwish.png'
import { ARROW_RIGHT, COUNTRY_CODES, FLAG_LOGO_URL, PLUGIN_VIEW, PLUGIN_VIEW_LEGACY, SIMPLE_ICONS } from '../../constants/indexConstants.js'
import { devPlugin, getBuyPlugins, getSellPlugins, pluginUrlMap } from '../../constants/plugins/GuiPlugins.js'
import s from '../../locales/strings.js'
import { getSyncedSettingsAsync, setSyncedSettingsAsync } from '../../modules/Core/Account/settings.js'
import Text from '../../modules/UI/components/FormattedText'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import styles from '../../styles/scenes/PluginsStyle.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type BuySellPlugin } from '../../types/GuiPluginTypes.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type CountryData } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { CountrySelectionModal } from '../modals/CountrySelectionModal.js'
import { SimpleConfirmationModal } from '../modals/SimpleConfirmationModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'

const paymentTypeLogosById = {
  credit: paymentTypeLogoCreditCard,
  applepay: paymentTypeLogoApplePay,
  bank: paymentTypeLogoBankTransfer,
  bankgirot: paymentTypeLogoBankgirot,
  cash: paymentTypeLogoCash,
  fasterPayments: paymentTypeLogoFasterPayments,
  giftcard: paymentTypeLogoGiftCard,
  ideal: paymentTypeLogoIdeal,
  newsagent: paymentTypeLogoNewsagent,
  poli: paymentTypeLogoPoli,
  swish: paymentTypeLogoSwish
}

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
type State = {
  developerUri: string
}

const MODAL_DATA_FILE = 'pluginModalTracker.json'
const DEVELOPER_PLUGIN_KEY = 'developerPlugin'
const asDeveloperUri = asObject({ uri: asString })

class GuiPluginList extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      developerUri: ''
    }
  }

  async componentDidMount () {
    await this.checkDisclaimer()
    this.checkCountry()

    const text = await AsyncStorage.getItem(DEVELOPER_PLUGIN_KEY)
    if (text != null) {
      const clean = asDeveloperUri(JSON.parse(text))
      this.setState({ developerUri: clean.uri })
    }
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
  checkCountry () {
    const { countryCode } = this.props
    if (!countryCode) this.showCountrySelectionModal().catch(showError)
  }

  /**
   * Launch the provided plugin, including pre-flight checks.
   */
  async openPlugin (listRow: BuySellPlugin) {
    const { pluginId } = listRow
    const plugin = pluginUrlMap[pluginId]

    // Grab a custom URI if necessary:
    let deepPath: string | void = listRow.addOnUrl
    if (pluginId === 'custom') {
      const { developerUri } = this.state
      const modal = createInputModal({
        icon: <IonIcon name="md-globe" size={42} color={THEME.COLORS.SECONDARY} />,
        title: s.strings.load_plugin,
        input: {
          label: s.strings.plugin_url,
          autoCorrect: false,
          returnKeyType: 'go',
          initialValue: developerUri,
          autoFocus: true
        },
        yesButton: { title: s.strings.load_plugin },
        noButton: { title: s.strings.string_cancel_cap }
      })
      deepPath = await launchModal(modal)
      if (deepPath == null) return

      if (deepPath !== developerUri) {
        this.setState({ developerUri: deepPath })

        // Write to disk lazily:
        AsyncStorage.setItem(DEVELOPER_PLUGIN_KEY, JSON.stringify({ uri: deepPath })).catch(showError)
      }
    }

    // Launch!
    if (plugin.isLegacy) {
      return Actions[PLUGIN_VIEW_LEGACY]({ plugin })
    }
    return Actions[PLUGIN_VIEW]({ plugin, deepPath })
  }

  async showCountrySelectionModal () {
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
      } catch (error) {
        showError(error)
      }
    }
  }

  _handleCountryPress = () => {
    this.showCountrySelectionModal().catch(showError)
  }

  _renderPlugin = ({ item }) => {
    const { pluginId } = item
    const plugin = pluginUrlMap[pluginId]

    return (
      <TouchableWithoutFeedback onPress={() => this.openPlugin(item).catch(showError)}>
        <View style={styles.pluginRow}>
          <View style={styles.pluginRowLogoAndInfo}>
            <View style={styles.logo}>
              <Image style={styles.logoImage} source={paymentTypeLogosById[item.paymentTypeLogoKey]} />
            </View>
            <View style={styles.textBoxWrap}>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.subtitleText}>{item.cryptoCodes.length > 0 && `Currencies: ${item.cryptoCodes.join(', ')}`}</Text>
              <Text style={styles.subtitleText}>{item.description}</Text>
            </View>
          </View>
          <View style={styles.pluginRowPoweredByRow}>
            <Text style={styles.footerText}>Powered by </Text>
            <Image style={styles.partnerIconImage} source={{ uri: item.partnerIconPath }} />
            <Text style={styles.footerText}> {plugin.name}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  render () {
    const { countryCode, developerModeOn, direction } = this.props
    const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === countryCode)

    // Pick a filter based on our direction:
    const plugins: Array<BuySellPlugin> = direction === 'buy' ? getBuyPlugins(Platform.OS, countryCode) : getSellPlugins(Platform.OS, countryCode)

    // Sort the plugins:
    plugins.sort((a: BuySellPlugin, b: BuySellPlugin) => a.priority - b.priority)

    // Add the dev mode plugin if enabled:
    if (developerModeOn) {
      plugins.push(devPlugin)
    }

    return (
      <SceneWrapper background="body">
        {this.renderCountryPicker(countryData)}
        {plugins.length === 0 ? (
          <View style={{ flex: 1, width: '100%', padding: scale(50), justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ textAlign: 'center' }}>{s.strings.buy_sell_crypto_no_plugin_region}</Text>
          </View>
        ) : (
          <FlatList data={plugins} renderItem={this._renderPlugin} keyExtractor={item => item.id} />
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
        <TouchableWithoutFeedback style={styles.selectedCountry} onPress={this._handleCountryPress}>
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

export const GuiPluginListScene = connect(
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
)(GuiPluginList)
