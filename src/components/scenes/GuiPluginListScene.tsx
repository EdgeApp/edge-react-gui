import AsyncStorage from '@react-native-async-storage/async-storage'
import { asObject, asString } from 'cleaners'
import { Disklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { Image, ListRenderItemInfo, Platform, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Animated from 'react-native-reanimated'

import { showBackupForTransferModal } from '../../actions/BackupModalActions'
import { NestedDisableMap } from '../../actions/ExchangeInfoActions'
import { readSyncedSettings, updateOneSetting, writeSyncedSettings } from '../../actions/SettingsActions'
import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES } from '../../constants/CountryConstants'
import buyPluginJsonRaw from '../../constants/plugins/buyPluginList.json'
import buyPluginJsonOverrideRaw from '../../constants/plugins/buyPluginListOverride.json'
import { customPluginRow, guiPlugins } from '../../constants/plugins/GuiPlugins'
import sellPluginJsonRaw from '../../constants/plugins/sellPluginList.json'
import sellPluginJsonOverrideRaw from '../../constants/plugins/sellPluginListOverride.json'
import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import { executePlugin } from '../../plugins/gui/fiatPlugin'
import { SceneScrollHandler, useSceneScrollHandler } from '../../state/SceneScrollState'
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
import { InsetStyle, SceneWrapper } from '../common/SceneWrapper'
import { CountryListModal } from '../modals/CountryListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { CardUi4 } from '../ui4/CardUi4'
import { RowUi4 } from '../ui4/RowUi4'
import { SectionHeaderUi4 } from '../ui4/SectionHeaderUi4'

const buyRaw = buyPluginJsonOverrideRaw.length > 0 ? buyPluginJsonOverrideRaw : buyPluginJsonRaw
const sellRaw = sellPluginJsonOverrideRaw.length > 0 ? sellPluginJsonOverrideRaw : sellPluginJsonRaw

const buySellPlugins: BuySellPlugins = {
  buy: asGuiPluginJson(buyRaw),
  sell: asGuiPluginJson(sellRaw)
}

const buySellPluginsJson = JSON.stringify(buySellPlugins)

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
  pix: 'paymentTypeLogoPix',
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
  insetStyle: InsetStyle
  handleScroll: SceneScrollHandler
}

interface DispatchProps {
  updateCountryCode: (countryCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps
interface State {
  developerUri: string
  buySellPlugins: BuySellPlugins
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
      buySellPlugins
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
    const diskPluginsJson = JSON.stringify(diskPlugins)

    // Convert to and from JSON so we don't overwrite the default object
    let currentPluginsJson = diskPlugins != null ? diskPluginsJson : buySellPluginsJson
    const currentPlugins = asBuySellPlugins(JSON.parse(currentPluginsJson))

    // Grab plugin settings that patch the json
    try {
      const response = await fetchInfo(`v1/buySellPluginsPatch/${config.appId ?? 'edge'}`)
      const reply = await response.json()
      const networkPluginsPatch = asBuySellPlugins(reply) ?? {}
      const directions: Array<'buy' | 'sell'> = ['buy', 'sell']
      for (const direction of directions) {
        const patches = networkPluginsPatch[direction]
        if (patches == null) {
          // Assign the defaults
          currentPlugins[direction] = buySellPlugins[direction]
          continue
        }
        const currentDirection = currentPlugins[direction] ?? []
        if (currentPlugins[direction] == null) {
          currentPlugins[direction] = currentDirection
        }
        for (const patch of patches) {
          // Skip comment rows
          if (typeof patch === 'string') continue

          const { id } = patch
          const matchingIndex = currentDirection.findIndex(plugin => typeof plugin !== 'string' && plugin.id === id)
          if (matchingIndex > -1) {
            currentDirection[matchingIndex] = patch
          } else {
            currentDirection.push(patch)
          }
        }
      }
    } catch (e: any) {
      console.log(e.message)
      // This is ok. We just use default values
    }

    currentPluginsJson = JSON.stringify(currentPlugins)
    if (currentPlugins != null && currentPluginsJson !== diskPluginsJson) {
      await coreDisklet
        .setText(PLUGIN_LIST_FILE, currentPluginsJson)
        .then(() => (diskPlugins = currentPlugins))
        .catch(e => console.error(e.message))
      this.setPluginState(currentPlugins)
    }
    this.timeoutId = setTimeout(async () => await this.updatePluginsNetwork(currentPlugins), BUY_SELL_PLUGIN_REFRESH_INTERVAL)
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
  async openPlugin(listRow: GuiPluginRow, longPress: boolean = false) {
    const { accountReferral, coreDisklet, countryCode, deviceId, disablePlugins, navigation, account } = this.props
    const { pluginId, paymentType, deepQuery = {} } = listRow
    const plugin = guiPlugins[pluginId]

    // Don't allow light accounts to enter plugins
    if (account.username == null) {
      showBackupForTransferModal(() => navigation.navigate('upgradeUsername', {}))
      return
    }

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
        accountReferral,
        deviceId,
        direction,
        disablePlugins: disableProviders,
        disklet: coreDisklet,
        guiPlugin: plugin,
        longPress,
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
      <CardUi4
        icon={
          <Image
            style={styles.logo}
            // @ts-expect-error
            source={theme[paymentTypeLogosById[item.paymentTypeLogoKey]]}
          />
        }
        onPress={async () => await this.openPlugin(item).catch(showError)}
        onLongPress={async () => await this.openPlugin(item, true).catch(showError)}
        paddingRem={[1, 0.5, 1, 0.5]}
      >
        <View style={styles.rowContainer}>
          <EdgeText style={styles.titleText}>{item.title}</EdgeText>
          {item.description === '' ? null : <EdgeText style={styles.subtitleText}>{item.description}</EdgeText>}
          {poweredBy != null && item.partnerIconPath != null ? (
            <>
              <DividerLine marginRem={[0.25, 1, 0.25, 0]} />
              <View style={styles.pluginRowPoweredByRow}>
                <EdgeText style={styles.footerText}>{lstrings.plugin_powered_by_space}</EdgeText>
                <Image style={styles.partnerIconImage} source={pluginPartnerLogo} />
                <EdgeText style={styles.footerText}>{' ' + poweredBy}</EdgeText>
              </View>
            </>
          ) : null}
        </View>
      </CardUi4>
    )
  }

  renderTop = () => {
    const { countryCode, theme } = this.props
    const styles = getStyles(theme)
    const direction = this.getSceneDirection()
    const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === countryCode)

    return (
      <>
        <View style={styles.header}>
          <SceneHeader title={direction === 'buy' ? lstrings.title_plugin_buy : lstrings.title_plugin_sell} underline withTopMargin />
        </View>
        <SectionHeaderUi4 leftTitle={lstrings.title_select_region} />
        <CardUi4>
          <RowUi4
            onPress={this._handleCountryPress}
            rightButtonType="none"
            icon={
              countryData == null ? undefined : (
                <FastImage
                  source={{ uri: `${FLAG_LOGO_URL}/${countryData.filename || countryData.name.toLowerCase().replace(' ', '-')}.png` }}
                  style={styles.selectedCountryFlag}
                />
              )
            }
            body={countryData ? countryData.name : lstrings.buy_sell_crypto_select_country_button}
          />
        </CardUi4>
        <SectionHeaderUi4 leftTitle={lstrings.title_select_payment_method} />
      </>
    )
  }

  render() {
    const { accountPlugins, accountReferral, countryCode, developerModeOn, disablePlugins, theme, insetStyle } = this.props
    const direction = this.getSceneDirection()
    const { buy = [], sell = [] } = this.state.buySellPlugins
    const styles = getStyles(theme)

    // Pick a filter based on our direction:
    let plugins = filterGuiPluginJson(direction === 'buy' ? buy : sell, Platform.OS, countryCode, disablePlugins)

    // Filter disabled plugins:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, undefined)
    plugins = plugins.filter(plugin => !activePlugins.disabled[plugin.pluginId])

    if (!ENV.ENABLE_VISA_PROGRAM) {
      plugins = plugins.filter(plugin => plugin.pluginId !== 'rewardscard')
    }

    // Add the dev mode plugin if enabled:
    if (developerModeOn) {
      plugins.push(customPluginRow)
    }

    return (
      <View style={styles.sceneContainer}>
        {plugins.length === 0 ? (
          <View style={styles.emptyPluginContainer}>
            <EdgeText style={styles.emptyPluginText} numberOfLines={2}>
              {lstrings.buy_sell_crypto_no_provider_region}
            </EdgeText>
          </View>
        ) : (
          <Animated.FlatList
            data={plugins}
            onScroll={this.props.handleScroll}
            ListHeaderComponent={this.renderTop}
            renderItem={this.renderPlugin}
            keyExtractor={(item: GuiPluginRow) => item.pluginId + item.title}
            // XXX: Hack. paddingBottom from insetStyle is not sufficient.
            contentContainerStyle={{ ...insetStyle, paddingBottom: theme.rem(6) }}
          />
        )}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    marginLeft: -theme.rem(0.5),
    width: '100%'
  },
  rowContainer: {
    flexDirection: 'column'
  },
  sceneContainer: {
    flex: 1
  },
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
    margin: theme.rem(0.25),
    marginRight: theme.rem(1)
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
  pluginRowPoweredByRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  logo: {
    margin: theme.rem(0.5),
    width: theme.rem(2),
    height: theme.rem(2),
    aspectRatio: 1,
    resizeMode: 'contain'
  },
  titleText: {
    fontFamily: theme.fontFaceMedium
  },
  subtitleText: {
    marginTop: theme.rem(0.25),
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

  const handleScroll = useSceneScrollHandler()

  const updateCountryCode = (countryCode: string) => {
    dispatch(updateOneSetting({ countryCode }))
  }

  return (
    <SceneWrapper hasTabs hasNotifications padding={theme.rem(0.5)}>
      {({ insetStyle, undoInsetStyle }) => {
        return (
          <View style={undoInsetStyle}>
            <GuiPluginList
              handleScroll={handleScroll}
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
              insetStyle={insetStyle}
            />
          </View>
        )
      }}
    </SceneWrapper>
  )
})
