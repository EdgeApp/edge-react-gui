import AsyncStorage from '@react-native-async-storage/async-storage'
import { asObject, asString } from 'cleaners'
import { EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { FlatList, Image, Platform, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { updateOneSetting } from '../../actions/SettingsActions'
import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES } from '../../constants/CountryConstants'
import { customPluginRow, guiPlugins } from '../../constants/plugins/GuiPlugins'
import s from '../../locales/strings'
import { getSyncedSettings, setSyncedSettings } from '../../modules/Core/Account/settings'
import { executePlugin } from '../../plugins/gui/fiatPlugin'
import { config } from '../../theme/appConfig'
import { asGuiPluginJson, GuiPluginRow } from '../../types/GuiPluginTypes'
import { connect } from '../../types/reactRedux'
import { AccountReferral } from '../../types/ReferralTypes'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { PluginTweak } from '../../types/TweakTypes'
import { getPartnerIconUri } from '../../util/CdnUris'
import { filterGuiPluginJson } from '../../util/GuiPluginTools'
import { bestOfPlugins } from '../../util/ReferralHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { CountryListModal } from '../modals/CountryListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'

const buyPluginJson = asGuiPluginJson(require('../../constants/plugins/buyPluginList.json'))
const sellPluginJson = asGuiPluginJson(require('../../constants/plugins/sellPluginList.json'))

const paymentTypeLogosById = {
  applepay: 'paymentTypeLogoApplePay',
  auspost: 'paymentTypeLogoAuspost',
  bank: 'paymentTypeLogoBankTransfer',
  bankgirot: 'paymentTypeLogoBankgirot',
  cash: 'paymentTypeLogoCash',
  credit: 'paymentTypeLogoCreditCard',
  debit: 'paymentTypeLogoDebitCard',
  fasterPayments: 'paymentTypeLogoFasterPayments',
  giftcard: 'paymentTypeLogoGiftCard',
  googlepay: 'paymentTypeLogoGooglePay',
  ideal: 'paymentTypeLogoIdeal',
  interac: 'paymentTypeLogoInterac',
  payid: 'paymentTypeLogoPayid',
  paynow: 'paymentTypeLogoPaynow',
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
  navigation: NavigationProp<'pluginListBuy'> | NavigationProp<'pluginListSell'>
  route: RouteProp<'pluginListBuy'> | RouteProp<'pluginListSell'>
}

type StateProps = {
  account: EdgeAccount
  accountPlugins: PluginTweak[]
  accountReferral: AccountReferral
  countryCode: string
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
    const message = sprintf(s.strings.plugin_service_provider_disclaimer, config.appName)
    try {
      const text = await account.disklet.getText(MODAL_DATA_FILE)
      const json = JSON.parse(text)
      const timesPluginWarningModalViewed = json.viewed
      if (timesPluginWarningModalViewed < 3) {
        const newNumber = timesPluginWarningModalViewed + 1
        if (newNumber === 3) {
          await Airship.show<'ok' | undefined>(bridge => (
            <ButtonsModal bridge={bridge} message={message} buttons={{ ok: { label: s.strings.string_ok_cap } }} />
          ))
        }
        const newText = JSON.stringify({
          viewed: newNumber
        })
        await account.disklet.setText(MODAL_DATA_FILE, newText)
      }
    } catch (e: any) {
      const json = {
        viewed: 1
      }
      const text = JSON.stringify(json)
      await account.disklet.setText(MODAL_DATA_FILE, text)
      await Airship.show<'ok' | undefined>(bridge => <ButtonsModal bridge={bridge} message={message} buttons={{ ok: { label: s.strings.string_ok_cap } }} />)
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
    const { countryCode, navigation, route, account } = this.props
    const { pluginId, paymentType, deepQuery = {} } = listRow
    const plugin = guiPlugins[pluginId]

    // Add countryCode
    if (plugin.needsCountryCode) {
      deepQuery.countryCode = countryCode
    }

    // Grab a custom URI if necessary:
    let { deepPath } = listRow
    if (pluginId === 'custom') {
      const { developerUri } = this.state
      // @ts-expect-error
      deepPath = await Airship.show<string | undefined>(bridge => (
        <TextInputModal
          autoCorrect={false}
          autoCapitalize="none"
          bridge={bridge}
          initialValue={developerUri}
          inputLabel={s.strings.plugin_url}
          returnKeyType="go"
          submitLabel={s.strings.load_plugin}
          title={s.strings.load_plugin}
        />
      ))
      if (deepPath == null) return

      if (deepPath !== developerUri) {
        this.setState({ developerUri: deepPath })

        // Write to disk lazily:
        AsyncStorage.setItem(DEVELOPER_PLUGIN_KEY, JSON.stringify({ uri: deepPath })).catch(showError)
      }
    }

    const regionCode = { countryCode }
    if (plugin.nativePlugin != null) {
      executePlugin({ guiPlugin: plugin, regionCode, paymentType, navigation, account })
    } else {
      // Launch!
      navigation.navigate(route.params.direction === 'buy' ? 'pluginViewBuy' : 'pluginViewSell', {
        plugin,
        deepPath,
        deepQuery
      })
    }
  }

  async showCountrySelectionModal() {
    const { account, updateCountryCode, countryCode } = this.props

    const selectedCountryCode: string = await Airship.show<string>(bridge => <CountryListModal bridge={bridge} countryCode={countryCode} />)
    if (selectedCountryCode) {
      try {
        const syncedSettings = await getSyncedSettings(account)
        const updatedSettings = {
          ...syncedSettings,
          countryCode: selectedCountryCode
        }
        updateCountryCode(selectedCountryCode)
        await setSyncedSettings(account, updatedSettings)
      } catch (error: any) {
        showError(error)
      }
    }
  }

  _handleCountryPress = () => {
    this.showCountrySelectionModal().catch(showError)
  }

  // @ts-expect-error
  renderPlugin = ({ item }) => {
    const { theme } = this.props
    const { pluginId } = item
    const plugin = guiPlugins[pluginId]
    const styles = getStyles(this.props.theme)
    // @ts-expect-error
    const pluginPartnerLogo = pluginPartnerLogos[pluginId] ? theme[pluginPartnerLogos[pluginId]] : { uri: getPartnerIconUri(item.partnerIconPath) }
    const poweredBy = plugin.poweredBy ?? plugin.displayName

    return (
      <View style={styles.pluginRowContainer}>
        <TouchableOpacity onPress={async () => this.openPlugin(item).catch(showError)}>
          <View style={styles.pluginRowLogoAndInfo}>
            {/* @ts-expect-error */}
            <Image style={styles.logo} source={theme[paymentTypeLogosById[item.paymentTypeLogoKey]]} />
            <View style={styles.pluginTextContainer}>
              <EdgeText style={styles.titleText}>{item.title}</EdgeText>
              <EdgeText style={styles.subtitleText}>{item.description}</EdgeText>
            </View>
          </View>
          {poweredBy != null && item.partnerIconPath != null ? (
            <View style={styles.pluginRowPoweredByRow}>
              <EdgeText style={styles.footerText}>{s.strings.plugin_powered_by_space}</EdgeText>
              <Image style={styles.partnerIconImage} source={pluginPartnerLogo} />
              <EdgeText style={styles.footerText}>{' ' + poweredBy}</EdgeText>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    )
  }

  render() {
    const { accountPlugins, accountReferral, countryCode, developerModeOn, theme, route } = this.props
    const { direction } = route.params ?? { direction: 'buy' }
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
        {/* @ts-expect-error */}
        <SceneHeader title={direction === 'buy' ? s.strings.title_plugin_buy : s.strings.title_plugin_sell} underline marginTop />
        <TouchableOpacity style={styles.selectedCountryRow} onPress={this._handleCountryPress}>
          {countryData && (
            <FastImage
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
