import AsyncStorage from '@react-native-async-storage/async-storage'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import { asObject, asString } from 'cleaners'
import { Disklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { Image, Platform, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { NestedDisableMap } from '../../actions/ExchangeInfoActions'
import { readSyncedSettings, updateOneSetting, writeSyncedSettings } from '../../actions/SettingsActions'
import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES } from '../../constants/CountryConstants'
import buyPluginJsonRaw from '../../constants/plugins/buyPluginList.json'
import { customPluginRow, guiPlugins } from '../../constants/plugins/GuiPlugins'
import sellPluginJsonRaw from '../../constants/plugins/sellPluginList.json'
import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import { checkWyreHasLinkedBank, executePlugin } from '../../plugins/gui/fiatPlugin'
import { config } from '../../theme/appConfig'
import { asBuySellPlugins, asGuiPluginJson, BuySellPlugins, GuiPluginRow } from '../../types/GuiPluginTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { AccountReferral } from '../../types/ReferralTypes'
import { EdgeSceneProps } from '../../types/routerTypes'
import { PluginTweak } from '../../types/TweakTypes'
import { getPartnerIconUri } from '../../util/CdnUris'
import { filterGuiPluginJson } from '../../util/GuiPluginTools'
import { fetchInfo } from '../../util/network'
import { bestOfPlugins } from '../../util/ReferralHelpers'
import { base58ToUuid } from '../../util/utils'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { CountryListModal } from '../modals/CountryListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'

const buySellPlugins: BuySellPlugins = {
  buy: asGuiPluginJson(buyPluginJsonRaw),
  sell: asGuiPluginJson(sellPluginJsonRaw)
}

const paymentTypeLogosById = {
  applepay: 'paymentTypeLogoApplePay',
  auspost: 'paymentTypeLogoAuspost',
  bank: 'paymentTypeLogoBankTransfer',
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
  upi: 'paymentTypeLogoUpi',
  visa: 'paymentTypeVisa'
}
const pluginPartnerLogos: { [key: string]: 'guiPluginLogoMoonpay' } = {
  moonpay: 'guiPluginLogoMoonpay'
}

interface OwnProps extends EdgeSceneProps<'pluginListBuy' | 'pluginListSell'> {}

interface StateProps {
  account: EdgeAccount
  accountPlugins: PluginTweak[]
  accountReferral: AccountReferral
  coreDisklet: Disklet
  countryCode: string
  developerModeOn: boolean
  deviceId: string
  disablePlugins: NestedDisableMap
  contentContainerStyle: { paddingBottom?: number }
}

interface DispatchProps {
  updateCountryCode: (countryCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps
interface State {
  developerUri: string
  buySellPlugins: BuySellPlugins
  hasWyreAccountHack: boolean
}

const BUY_SELL_PLUGIN_REFRESH_INTERVAL = 60000
const DEVELOPER_PLUGIN_KEY = 'developerPlugin'
const PLUGIN_LIST_FILE = 'buySellPlugins.json'
const asDeveloperUri = asObject({ uri: asString })

class GuiPluginList extends React.PureComponent<Props, State> {
  componentMounted: boolean
  timeoutId: ReturnType<typeof setTimeout> | undefined

  constructor(props: Props) {
    super(props)
    this.state = {
      developerUri: '',
      buySellPlugins,
      hasWyreAccountHack: false
    }
    this.componentMounted = true
  }

  async componentDidMount() {
    this.updatePlugins().catch(err => showError(err))
    this.checkCountry()
    const text = await AsyncStorage.getItem(DEVELOPER_PLUGIN_KEY)
    if (text != null) {
      const clean = asDeveloperUri(JSON.parse(text))
      this.setState({ developerUri: clean.uri })
    }
    checkWyreHasLinkedBank(this.props.account.dataStore)
      .then(linked => {
        if (this.componentMounted && linked != null) {
          this.setState({ hasWyreAccountHack: linked })
        }
      })
      .catch((e: any) => console.error(e.message))
  }

  componentWillUnmount() {
    this.componentMounted = false
    if (this.timeoutId != null) clearTimeout(this.timeoutId)
  }

  setPluginState(plugins: BuySellPlugins): void {
    if (this.componentMounted && plugins != null) {
      this.setState({
        buySellPlugins: {
          buy: plugins.buy ?? buySellPlugins.buy,
          sell: plugins.sell ?? buySellPlugins.sell
        }
      })
    }
  }

  async updatePlugins() {
    const { coreDisklet } = this.props
    let diskPlugins
    try {
      const fileText = await coreDisklet.getText(PLUGIN_LIST_FILE)
      diskPlugins = asBuySellPlugins(JSON.parse(fileText))
      this.setPluginState(diskPlugins)
    } catch (e: any) {
      console.log(e.message, `Error opening ${PLUGIN_LIST_FILE}. Trying network instead`)
    }
    await this.updatePluginsNetwork(diskPlugins)
  }

  async updatePluginsNetwork(diskPlugins: BuySellPlugins | undefined) {
    const { coreDisklet } = this.props
    let networkPlugins: BuySellPlugins
    try {
      const response = await fetchInfo(`v1/buySellPlugins/${config.appId ?? 'edge'}`)
      const reply = await response.json()
      networkPlugins = asBuySellPlugins(reply)
      if (JSON.stringify(networkPlugins) !== JSON.stringify(diskPlugins)) {
        await coreDisklet
          .setText(PLUGIN_LIST_FILE, JSON.stringify(networkPlugins))
          .then(() => (diskPlugins = networkPlugins))
          .catch(e => console.error(e.message))
        this.setPluginState(networkPlugins)
      }
    } catch (e: any) {
      console.log(e.message)
      // This is ok. We just use default values
    }
    this.timeoutId = setTimeout(async () => await this.updatePluginsNetwork(diskPlugins), BUY_SELL_PLUGIN_REFRESH_INTERVAL)
  }

  /**
   * Verify that we have a country selected
   */
  checkCountry() {
    const { countryCode } = this.props
    if (!countryCode) this.showCountrySelectionModal().catch(showError)
  }

  /**
   * Get the scene's direction from the route information. This determines
   * which plugin list to show.
   */
  getSceneDirection(): 'buy' | 'sell' {
    return this.props.route.name === 'pluginListSell' ? 'sell' : 'buy'
  }

  /**
   * Launch the provided plugin, including pre-flight checks.
   */
  async openPlugin(listRow: GuiPluginRow) {
    const { countryCode, deviceId, disablePlugins, navigation, account } = this.props
    const { pluginId, paymentType, deepQuery = {} } = listRow
    const plugin = guiPlugins[pluginId]

    // Grab a custom URI if necessary:
    let { deepPath = undefined } = listRow
    if (pluginId === 'custom') {
      const { developerUri } = this.state
      deepPath = await Airship.show<string | undefined>(bridge => (
        <TextInputModal
          autoCorrect={false}
          autoCapitalize="none"
          bridge={bridge}
          initialValue={developerUri}
          inputLabel={lstrings.plugin_url}
          returnKeyType="go"
          submitLabel={lstrings.load_plugin}
          title={lstrings.load_plugin}
        />
      ))
      if (deepPath == null) return

      if (deepPath !== developerUri) {
        this.setState({ developerUri: deepPath })

        // Write to disk lazily:
        AsyncStorage.setItem(DEVELOPER_PLUGIN_KEY, JSON.stringify({ uri: deepPath })).catch(showError)
      }
    }

    const direction = this.getSceneDirection()
    if (plugin.nativePlugin != null) {
      const disableProviders = disablePlugins[pluginId]

      // This should not happen, since we don't show disabled rows:
      if (disableProviders === true) return

      await executePlugin({
        account,
        deviceId,
        direction,
        disablePlugins: disableProviders,
        guiPlugin: plugin,
        navigation,
        paymentType,
        regionCode: { countryCode }
      })
    } else {
      // Launch!
      navigation.navigate(direction === 'buy' ? 'pluginViewBuy' : 'pluginViewSell', {
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
        const syncedSettings = await readSyncedSettings(account)
        const updatedSettings = {
          ...syncedSettings,
          countryCode: selectedCountryCode
        }
        updateCountryCode(selectedCountryCode)
        await writeSyncedSettings(account, updatedSettings)
      } catch (error: any) {
        showError(error)
      }
    }
  }

  _handleCountryPress = () => {
    this.showCountrySelectionModal().catch(showError)
  }

  renderPlugin = ({ item }: ListRenderItemInfo<GuiPluginRow>) => {
    const { theme } = this.props
    const { pluginId } = item
    const plugin = guiPlugins[pluginId]
    if (plugin == null) return null

    if (plugin.betaOnly === true && !ENV.BETA_FEATURES) return null

    const styles = getStyles(this.props.theme)
    const partnerLogoThemeKey = pluginPartnerLogos[pluginId]
    const pluginPartnerLogo = partnerLogoThemeKey ? theme[partnerLogoThemeKey] : { uri: getPartnerIconUri(item.partnerIconPath ?? '') }
    const poweredBy = plugin.poweredBy ?? plugin.displayName

    return (
      <View style={styles.pluginRowContainer}>
        <TouchableOpacity onPress={async () => await this.openPlugin(item).catch(showError)}>
          <View style={styles.pluginRowLogoAndInfo}>
            <Image
              style={styles.logo}
              // @ts-expect-error
              source={theme[paymentTypeLogosById[item.paymentTypeLogoKey]]}
            />
            <View style={styles.pluginTextContainer}>
              <EdgeText style={styles.titleText}>{item.title}</EdgeText>
              <EdgeText style={styles.subtitleText}>{item.description}</EdgeText>
            </View>
          </View>
          {poweredBy != null && item.partnerIconPath != null ? (
            <View style={styles.pluginRowPoweredByRow}>
              <EdgeText style={styles.footerText}>{lstrings.plugin_powered_by_space}</EdgeText>
              <Image style={styles.partnerIconImage} source={pluginPartnerLogo} />
              <EdgeText style={styles.footerText}>{' ' + poweredBy}</EdgeText>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    )
  }

  render() {
    const { accountPlugins, accountReferral, countryCode, developerModeOn, disablePlugins, theme, contentContainerStyle } = this.props
    const direction = this.getSceneDirection()
    const { buy = [], sell = [] } = this.state.buySellPlugins
    const styles = getStyles(theme)
    const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === countryCode)

    // Pick a filter based on our direction:
    let plugins = filterGuiPluginJson(direction === 'buy' ? buy : sell, Platform.OS, countryCode, disablePlugins)

    // Filter disabled plugins:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, undefined)
    plugins = plugins.filter(plugin => !activePlugins.disabled[plugin.pluginId])

    if (!ENV.ENABLE_VISA_PROGRAM) {
      plugins = plugins.filter(plugin => plugin.pluginId !== 'rewardscard')
    }

    if (!this.state.hasWyreAccountHack) {
      plugins = plugins.filter(plugin => plugin.pluginId !== 'wyre')
    }

    // Add the dev mode plugin if enabled:
    if (developerModeOn) {
      plugins.push(customPluginRow)
    }

    return (
      <>
        <SceneHeader title={direction === 'buy' ? lstrings.title_plugin_buy : lstrings.title_plugin_sell} underline />
        <TouchableOpacity style={styles.selectedCountryRow} onPress={this._handleCountryPress}>
          {countryData && (
            <FastImage
              source={{ uri: `${FLAG_LOGO_URL}/${countryData.filename || countryData.name.toLowerCase().replace(' ', '-')}.png` }}
              style={styles.selectedCountryFlag}
            />
          )}
          <EdgeText style={styles.selectedCountryText}>{countryData ? countryData.name : lstrings.buy_sell_crypto_select_country_button}</EdgeText>
          <AntDesignIcon name="right" size={theme.rem(1)} color={theme.icon} />
        </TouchableOpacity>
        {plugins.length === 0 ? (
          <View style={styles.emptyPluginContainer}>
            <EdgeText style={styles.emptyPluginText} numberOfLines={2}>
              {lstrings.buy_sell_crypto_no_plugin_region}
            </EdgeText>
          </View>
        ) : (
          <FlashList
            data={plugins}
            renderItem={this.renderPlugin}
            keyExtractor={(item: GuiPluginRow) => item.pluginId + item.title}
            contentContainerStyle={contentContainerStyle}
          />
        )}
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  selectedCountryRow: {
    marginTop: theme.rem(1.5),
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

export const GuiPluginListScene = React.memo((props: OwnProps) => {
  const { navigation, route } = props
  const dispatch = useDispatch()
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const accountPlugins = useSelector(state => state.account.referralCache.accountPlugins)
  const accountReferral = useSelector(state => state.account.accountReferral)
  const deviceId = useSelector(state => base58ToUuid(state.core.context.clientId))
  const coreDisklet = useSelector(state => state.core.disklet)
  const countryCode = useSelector(state => state.ui.settings.countryCode)
  const developerModeOn = useSelector(state => state.ui.settings.developerModeOn)
  const direction = props.route.name === 'pluginListSell' ? 'sell' : 'buy'
  const disablePlugins = useSelector(state => state.ui.exchangeInfo[direction].disablePlugins)

  const updateCountryCode = (countryCode: string) => {
    dispatch(updateOneSetting({ countryCode }))
  }

  return (
    <NotificationSceneWrapper navigation={navigation} background="theme" hasTabs>
      {(gap, notificationHeight) => (
        <GuiPluginList
          navigation={navigation}
          route={route}
          deviceId={deviceId}
          account={account}
          accountPlugins={accountPlugins}
          accountReferral={accountReferral}
          coreDisklet={coreDisklet}
          countryCode={countryCode}
          developerModeOn={developerModeOn}
          disablePlugins={disablePlugins}
          updateCountryCode={updateCountryCode}
          theme={theme}
          contentContainerStyle={{ paddingBottom: notificationHeight }}
        />
      )}
    </NotificationSceneWrapper>
  )
})
