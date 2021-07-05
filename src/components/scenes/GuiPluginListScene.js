// @flow

import AsyncStorage from '@react-native-community/async-storage'
import { asObject, asString } from 'cleaners'
import { createInputModal } from 'edge-components'
import { type EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { FlatList, Image, Platform, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { updateOneSetting } from '../../actions/SettingsActions.js'
import { COUNTRY_CODES, FLAG_LOGO_URL } from '../../constants/CountryConstants.js'
import { customPluginRow, guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import { PLUGIN_VIEW } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { getSyncedSettings, setSyncedSettings } from '../../modules/Core/Account/settings.js'
import { type GuiPluginRow, asGuiPluginJson, filterGuiPluginJson } from '../../types/GuiPluginTypes.js'
import { connect } from '../../types/reactRedux.js'
import { type AccountReferral } from '../../types/ReferralTypes.js'
import { type PluginTweak } from '../../types/TweakTypes.js'
import { bestOfPlugins } from '../../util/ReferralHelpers.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { CountrySelectionModal } from '../modals/CountrySelectionModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

const buyPluginJson = asGuiPluginJson(require('../../constants/plugins/buyPluginList.json'))
const sellPluginJson = asGuiPluginJson(require('../../constants/plugins/sellPluginList.json'))

const paymentTypeLogosById = {
  credit: 'paymentTypeLogoCreditCard',
  auspost: 'paymentTypeLogoAuspost',
  applepay: 'paymentTypeLogoApplePay',
  bank: 'paymentTypeLogoBankTransfer',
  bankgirot: 'paymentTypeLogoBankgirot',
  cash: 'paymentTypeLogoCash',
  debit: 'paymentTypeLogoDebitCard',
  fasterPayments: 'paymentTypeLogoFasterPayments',
  giftcard: 'paymentTypeLogoGiftCard',
  ideal: 'paymentTypeLogoIdeal',
  newsagent: 'paymentTypeLogoNewsagent',
  payid: 'paymentTypeLogoPayid',
  poli: 'paymentTypeLogoPoli',
  sofort: 'paymentTypeLogoSofort',
  swish: 'paymentTypeLogoSwish',
  upi: 'paymentTypeLogoUpi'
}

const pluginPartnerLogos = {
  moonpay: 'guiPluginLogoMoonpay',
  bitaccess: 'guiPluginLogoBitaccess'
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
  updateCountryCode: (countryCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps
type State = {
  developerUri: string
}

const MODAL_DATA_FILE = 'pluginModalTracker.json'
const DEVELOPER_PLUGIN_KEY = 'developerPlugin'
const asDeveloperUri = asObject({ uri: asString })

class GuiPluginList extends React.PureComponent<Props, State> {
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
    const { theme } = this.props
    const { pluginId, deepQuery } = listRow
    const plugin = guiPlugins[pluginId]

    // Add countryCode
    if (plugin.needsCountryCode) {
      deepQuery.countryCode = this.props.countryCode
    }

    // Grab a custom URI if necessary:
    let { deepPath } = listRow
    if (pluginId === 'custom') {
      const { developerUri } = this.state
      const modal = createInputModal({
        icon: <IonIcon name="md-globe" size={theme.rem(2.75)} color={theme.buySellCustomPluginModalIcon} />,
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
    return Actions.push(PLUGIN_VIEW, {
      plugin,
      deepPath,
      deepQuery
    })
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

  renderPlugin = ({ item }) => {
    const { theme } = this.props
    const { pluginId } = item
    const plugin = guiPlugins[pluginId]
    const styles = getStyles(this.props.theme)
    const pluginPartnerLogo = pluginPartnerLogos[pluginId] ? theme[pluginPartnerLogos[pluginId]] : { uri: item.partnerIconPath }

    return (
      <View style={styles.pluginRowContainer}>
        <TouchableOpacity onPress={() => this.openPlugin(item).catch(showError)}>
          <View style={styles.pluginRowLogoAndInfo}>
            <Image style={styles.logo} source={theme[paymentTypeLogosById[item.paymentTypeLogoKey]]} />
            <View style={styles.pluginTextContainer}>
              <EdgeText style={styles.titleText}>{item.title}</EdgeText>
              <EdgeText style={styles.subtitleText} numberOfLines={0}>
                {item.cryptoCodes.length > 0 && `Currencies: ${item.cryptoCodes.join(', ')}`}
              </EdgeText>
              <EdgeText style={styles.subtitleText}>{item.description}</EdgeText>
            </View>
          </View>
          <View style={styles.pluginRowPoweredByRow}>
            <EdgeText style={styles.footerText}>{s.strings.plugin_powered_by + ' '}</EdgeText>
            <Image style={styles.partnerIconImage} source={pluginPartnerLogo} />
            <EdgeText style={styles.footerText}>{' ' + plugin.displayName}</EdgeText>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  render() {
    const { accountPlugins, accountReferral, countryCode, developerModeOn, direction, theme } = this.props
    const styles = getStyles(theme)
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
      <SceneWrapper background="header">
        <EdgeText style={styles.header}>{direction === 'buy' ? s.strings.title_plugin_buy : s.strings.title_plugin_sell}</EdgeText>
        <TouchableOpacity style={styles.selectedCountryRow} onPress={this._handleCountryPress}>
          {countryData && (
            <Image
              source={{ uri: `${FLAG_LOGO_URL}/${countryData.filename || countryData.name.toLowerCase().replace(' ', '-')}.png` }}
              style={styles.selectedCountryFlag}
            />
          )}
          <EdgeText style={styles.selectedCountryText}>{countryData ? countryData.name : s.strings.buy_sell_crypto_select_country_button}</EdgeText>
          <AntDesignIcon name="right" size={theme.rem(1)} color={theme.icon} />
        </TouchableOpacity>
        {plugins.length === 0 ? (
          <View style={styles.emptyPluginContainer}>
            <EdgeText style={styles.emptyPluginText} numberOfLines={2}>
              {s.strings.buy_sell_crypto_no_plugin_region}
            </EdgeText>
          </View>
        ) : (
          <FlatList data={plugins} renderItem={this.renderPlugin} keyExtractor={(item: GuiPluginRow) => item.pluginId + item.title} />
        )}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    marginVertical: theme.rem(1),
    marginHorizontal: theme.rem(1.5),
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceMedium
  },
  selectedCountryRow: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(1.5),
    marginHorizontal: theme.rem(1.5),
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectedCountryFlag: {
    height: theme.rem(2),
    width: theme.rem(2),
    borderRadius: theme.rem(1),
    marginRight: theme.rem(1.5)
  },
  selectedCountryText: {
    flex: 1,
    fontFamily: theme.fontFaceMedium
  },
  emptyPluginContainer: {
    flex: 1,
    padding: theme.rem(2),
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyPluginText: {
    textAlign: 'center'
  },
  pluginRowContainer: {
    borderTopWidth: theme.thinLineWidth,
    borderTopColor: theme.lineDivider,
    marginBottom: theme.rem(1),
    marginLeft: theme.rem(1.5),
    paddingTop: theme.rem(1),
    paddingRight: theme.rem(1.5)
  },
  pluginRowLogoAndInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pluginRowPoweredByRow: {
    marginTop: theme.rem(0.5),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  logo: {
    marginRight: theme.rem(1.5),
    width: theme.rem(2),
    maxHeight: theme.rem(2),
    resizeMode: 'contain'
  },
  pluginTextContainer: {
    width: '80%'
  },
  titleText: {
    marginBottom: theme.rem(0.25),
    fontFamily: theme.fontFaceMedium
  },
  subtitleText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  footerText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  partnerIconImage: {
    aspectRatio: 1,
    width: theme.rem(0.75),
    height: theme.rem(0.75)
  }
}))

export const GuiPluginListScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    account: state.core.account,
    accountPlugins: state.account.referralCache.accountPlugins,
    accountReferral: state.account.accountReferral,
    countryCode: state.ui.settings.countryCode,
    developerModeOn: state.ui.settings.developerModeOn
  }),
  dispatch => ({
    updateCountryCode(countryCode: string) {
      dispatch(updateOneSetting({ countryCode }))
    }
  })
)(withTheme(GuiPluginList))
