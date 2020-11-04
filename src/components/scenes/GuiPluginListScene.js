// @flow

import AsyncStorage from '@react-native-community/async-storage'
import { asObject, asString } from 'cleaners'
import { createInputModal } from 'edge-components'
import { type EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { FlatList, Image, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { updateOneSetting } from '../../actions/SettingsActions.js'
import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import paymentTypeLogoAuspost from '../../assets/images/paymentTypes/paymentTypeLogoAuspost.png'
import paymentTypeLogoBankgirot from '../../assets/images/paymentTypes/paymentTypeLogoBankgirot.png'
import paymentTypeLogoBankTransfer from '../../assets/images/paymentTypes/paymentTypeLogoBankTransfer.png'
import paymentTypeLogoBpay from '../../assets/images/paymentTypes/paymentTypeLogoBpay.png'
import paymentTypeLogoCash from '../../assets/images/paymentTypes/paymentTypeLogoCash.png'
import paymentTypeLogoCreditCard from '../../assets/images/paymentTypes/paymentTypeLogoCreditCard.png'
import paymentTypeLogoDebitCard from '../../assets/images/paymentTypes/paymentTypeLogoDebitCard.png'
import paymentTypeLogoFasterPayments from '../../assets/images/paymentTypes/paymentTypeLogoFasterPayments.png'
import paymentTypeLogoGiftCard from '../../assets/images/paymentTypes/paymentTypeLogoGiftCard.png'
import paymentTypeLogoIdeal from '../../assets/images/paymentTypes/paymentTypeLogoIdeal.png'
import paymentTypeLogoNewsagent from '../../assets/images/paymentTypes/paymentTypeLogoNewsagent.png'
import paymentTypeLogoPayid from '../../assets/images/paymentTypes/paymentTypeLogoPayid.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoSofort from '../../assets/images/paymentTypes/paymentTypeLogoSofort.png'
import paymentTypeLogoSwish from '../../assets/images/paymentTypes/paymentTypeLogoSwish.png'
import paymentTypeLogoUpi from '../../assets/images/paymentTypes/paymentTypeLogoUpi.png'
import { COUNTRY_CODES, FLAG_LOGO_URL, PLUGIN_VIEW, PLUGIN_VIEW_LEGACY } from '../../constants/indexConstants.js'
import { customPluginRow, guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import s from '../../locales/strings.js'
import { getSyncedSettings, setSyncedSettings } from '../../modules/Core/Account/settings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type GuiPluginRow, asGuiPluginJson, filterGuiPluginJson } from '../../types/GuiPluginTypes.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type AccountReferral } from '../../types/ReferralTypes.js'
import { type PluginTweak } from '../../types/TweakTypes.js'
import { type CountryData } from '../../types/types.js'
import { bestOfPlugins } from '../../util/ReferralHelpers.js'
import { scale } from '../../util/scaling.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { CountrySelectionModal } from '../modals/CountrySelectionModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'

const buyPluginJson = asGuiPluginJson(require('../../constants/plugins/buyPluginList.json'))
const sellPluginJson = asGuiPluginJson(require('../../constants/plugins/sellPluginList.json'))

const paymentTypeLogosById = {
  credit: paymentTypeLogoCreditCard,
  auspost: paymentTypeLogoAuspost,
  applepay: paymentTypeLogoApplePay,
  bank: paymentTypeLogoBankTransfer,
  bankgirot: paymentTypeLogoBankgirot,
  bpay: paymentTypeLogoBpay,
  cash: paymentTypeLogoCash,
  debit: paymentTypeLogoDebitCard,
  fasterPayments: paymentTypeLogoFasterPayments,
  giftcard: paymentTypeLogoGiftCard,
  ideal: paymentTypeLogoIdeal,
  newsagent: paymentTypeLogoNewsagent,
  payid: paymentTypeLogoPayid,
  poli: paymentTypeLogoPoli,
  sofort: paymentTypeLogoSofort,
  swish: paymentTypeLogoSwish,
  upi: paymentTypeLogoUpi
}

type OwnProps = {
  direction?: 'buy' | 'sell'
}

type StateProps = {
  account: EdgeAccount,
  accountPlugins: PluginTweak[],
  accountReferral: AccountReferral,
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

class GuiPluginList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      developerUri: ''
    }
  }

  async componentDidMount() {
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
  async checkDisclaimer() {
    const { account } = this.props
    try {
      const text = await account.disklet.getText(MODAL_DATA_FILE)
      const json = JSON.parse(text)
      const timesPluginWarningModalViewed = json.viewed
      if (timesPluginWarningModalViewed < 3) {
        const newNumber = timesPluginWarningModalViewed + 1
        if (newNumber === 3) {
          await Airship.show(bridge => (
            <ButtonsModal
              bridge={bridge}
              message={s.strings.plugin_provider_disclaimer}
              buttons={{
                ok: { label: s.strings.string_ok_cap }
              }}
            />
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
      await Airship.show(bridge => (
        <ButtonsModal
          bridge={bridge}
          message={s.strings.plugin_provider_disclaimer}
          buttons={{
            ok: { label: s.strings.string_ok_cap }
          }}
        />
      ))
    }
  }

  /**
   * Verify that we have a country selected
   */
  checkCountry() {
    const { countryCode } = this.props
    if (!countryCode) this.showCountrySelectionModal().catch(showError)
  }

  /**
   * Launch the provided plugin, including pre-flight checks.
   */
  async openPlugin(listRow: GuiPluginRow) {
    const { pluginId, deepQuery } = listRow
    const plugin = guiPlugins[pluginId]

    // Grab a custom URI if necessary:
    let { deepPath } = listRow
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
    return Actions[PLUGIN_VIEW]({ plugin, deepPath, deepQuery })
  }

  async showCountrySelectionModal() {
    const { account, updateCountryCode, countryCode } = this.props

    const selectedCountryCode: string = await Airship.show(bridge => <CountrySelectionModal bridge={bridge} countryCode={countryCode} />)
    if (selectedCountryCode) {
      try {
        const syncedSettings = await getSyncedSettings(account)
        const updatedSettings = {
          ...syncedSettings,
          countryCode: selectedCountryCode
        }
        updateCountryCode(selectedCountryCode)
        await setSyncedSettings(account, updatedSettings)
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
    const plugin = guiPlugins[pluginId]

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
            <Text style={styles.footerText}> {plugin.displayName}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  render() {
    const { accountPlugins, accountReferral, countryCode, developerModeOn, direction } = this.props
    const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === countryCode)

    // Pick a filter based on our direction:
    let plugins = filterGuiPluginJson(direction === 'buy' ? buyPluginJson : sellPluginJson, Platform.OS, countryCode)

    // Filter disabled plugins:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, undefined)
    plugins = plugins.filter(plugin => !activePlugins.disabled[plugin.pluginId])

    // Add the dev mode plugin if enabled:
    if (developerModeOn) {
      plugins.push(customPluginRow)
    }

    return (
      <SceneWrapper background="body">
        {this.renderCountryPicker(countryData)}
        {plugins.length === 0 ? (
          <View style={{ flex: 1, width: '100%', padding: scale(50), justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ textAlign: 'center' }}>{s.strings.buy_sell_crypto_no_plugin_region}</Text>
          </View>
        ) : (
          <FlatList data={plugins} renderItem={this._renderPlugin} keyExtractor={(item: GuiPluginRow) => item.pluginId} />
        )}
      </SceneWrapper>
    )
  }

  renderCountryPicker(countryData: CountryData | void) {
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
            <AntDesignIcon style={{ alignSelf: 'center' }} name="right" size={scale(16)} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }
}

const rawStyles = {
  selectedCountryWrapper: {
    padding: scale(16),
    backgroundColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  selectedCountry: {
    color: THEME.COLORS.GRAY_1,
    backgroundColor: THEME.COLORS.GRAY_3,
    borderRadius: scale(5),
    padding: scale(8)
  },
  selectedCountryTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  pluginRow: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    backgroundColor: THEME.COLORS.WHITE,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    width: '100%'
  },
  pluginRowLogoAndInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap'
  },
  pluginRowPoweredByRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%'
  },
  logo: {
    justifyContent: 'center',
    marginRight: scale(16),
    width: scale(50)
  },
  logoImage: {
    aspectRatio: 1,
    width: 50,
    height: 50,
    resizeMode: 'contain'
  },
  partnerIconImage: {
    aspectRatio: 1,
    height: scale(10)
  },
  textBoxWrap: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '80%'
  },
  titleText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(16),
    marginBottom: scale(4)
  },
  subtitleText: {
    fontSize: scale(12),
    lineHeight: scale(18)
  },
  footerText: {
    fontSize: scale(10),
    lineHeight: scale(16)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const GuiPluginListScene = connect(
  (state: RootState): StateProps => ({
    account: state.core.account,
    accountPlugins: state.account.referralCache.accountPlugins,
    accountReferral: state.account.accountReferral,
    countryCode: state.ui.settings.countryCode,
    developerModeOn: state.ui.settings.developerModeOn
  }),
  (dispatch: Dispatch): DispatchProps => ({
    updateCountryCode(countryCode: string) {
      dispatch(updateOneSetting({ countryCode }))
    }
  })
)(GuiPluginList)
