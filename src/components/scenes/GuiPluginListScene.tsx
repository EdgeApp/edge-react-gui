import { useIsFocused } from '@react-navigation/native'
import { Disklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { Image, ListRenderItemInfo, Platform, View } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import FastImage from 'react-native-fast-image'
import Animated from 'react-native-reanimated'
import { sprintf } from 'sprintf-js'

import { checkAndShowLightBackupModal } from '../../actions/BackupModalActions'
import { checkAndSetRegion, showCountrySelectionModal } from '../../actions/CountryListActions'
import { getDeviceSettings, writeDeveloperPluginUri } from '../../actions/DeviceSettingsActions'
import { NestedDisableMap } from '../../actions/ExchangeInfoActions'
import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES } from '../../constants/CountryConstants'
import buyPluginJsonRaw from '../../constants/plugins/buyPluginList.json'
import buyPluginJsonOverrideRaw from '../../constants/plugins/buyPluginListOverride.json'
import { customPluginRow, guiPlugins } from '../../constants/plugins/GuiPlugins'
import sellPluginJsonRaw from '../../constants/plugins/sellPluginList.json'
import sellPluginJsonOverrideRaw from '../../constants/plugins/sellPluginListOverride.json'
import { ENV } from '../../env'
import { useAsyncNavigation } from '../../hooks/useAsyncNavigation'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { executePlugin } from '../../plugins/gui/fiatPlugin'
import { SceneScrollHandler, useSceneScrollHandler } from '../../state/SceneScrollState'
import { asBuySellPlugins, asGuiPluginJson, BuySellPlugins, GuiPluginRow } from '../../types/GuiPluginTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { AccountReferral } from '../../types/ReferralTypes'
import { EdgeSceneProps } from '../../types/routerTypes'
import { PluginTweak } from '../../types/TweakTypes'
import { getPartnerIconUri } from '../../util/CdnUris'
import { getCurrencyCodeWithAccount } from '../../util/CurrencyInfoHelpers'
import { filterGuiPluginJson } from '../../util/GuiPluginTools'
import { infoServerData } from '../../util/network'
import { bestOfPlugins } from '../../util/ReferralHelpers'
import { logEvent, OnLogEvent } from '../../util/tracking'
import { base58ToUuid, getOsVersion } from '../../util/utils'
import { EdgeCard } from '../cards/EdgeCard'
import { filterPromoCards } from '../cards/PromoCards'
import { EdgeAnim, fadeInUp20, fadeInUp30, fadeInUp60, fadeInUp90 } from '../common/EdgeAnim'
import { InsetStyle, SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { TextInputModal } from '../modals/TextInputModal'
import { WalletListResult } from '../modals/WalletListModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

export interface GuiPluginListParams {
  launchPluginId?: string
  forcedWalletResult?: WalletListResult
}

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
  defaultIsoFiat: string
  developerModeOn: boolean
  deviceId: string
  disablePlugins: NestedDisableMap
  insetStyle: InsetStyle
  forcedWalletResult?: WalletListResult
  stateProvinceCode?: string
  onCountryPress: () => Promise<void>
  onPluginOpened: () => void
  onLogEvent: OnLogEvent
  onScroll: SceneScrollHandler
}

type Props = OwnProps & StateProps & ThemeProps
interface State {
  developerUri: string
  buySellPlugins: BuySellPlugins
}

const BUY_SELL_PLUGIN_REFRESH_INTERVAL = 60000

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
    this.updatePlugins()
    const { developerPluginUri } = getDeviceSettings()
    if (developerPluginUri != null) {
      this.setState({ developerUri: developerPluginUri })
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

  updatePlugins() {
    // Create new array objects so we aren't patching the original JSON
    const currentPlugins: BuySellPlugins = {
      buy: [...(buySellPlugins.buy ?? [])],
      sell: [...(buySellPlugins.sell ?? [])]
    }

    // Grab plugin settings that patch the json
    try {
      const networkPluginsPatch = asBuySellPlugins(infoServerData.rollup?.buySellPluginsPatch ?? {})
      const directions: Array<'buy' | 'sell'> = ['buy', 'sell']
      for (const direction of directions) {
        const patches = networkPluginsPatch[direction]
        if (patches == null) {
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

    const currentPluginsJson = JSON.stringify(currentPlugins)
    if (currentPluginsJson !== buySellPluginsJson) {
      this.setPluginState(currentPlugins)
    }
    this.timeoutId = setTimeout(() => this.updatePlugins(), BUY_SELL_PLUGIN_REFRESH_INTERVAL)
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
    const {
      account,
      accountReferral,
      coreDisklet,
      countryCode,
      defaultIsoFiat,
      deviceId,
      disablePlugins,
      forcedWalletResult,
      navigation,
      stateProvinceCode,
      onLogEvent,
      onPluginOpened
    } = this.props
    const { pluginId, paymentType, deepQuery = {} } = listRow
    const plugin = guiPlugins[pluginId]

    // Don't allow light accounts to enter buy webview plugins
    const direction = this.getSceneDirection()
    if (direction === 'buy' && plugin.nativePlugin == null && checkAndShowLightBackupModal(account, navigation)) return

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
        writeDeveloperPluginUri(deepPath).catch(error => showError(error))
      }
    }
    if (plugin.nativePlugin != null) {
      const cards = infoServerData.rollup?.promoCards2 ?? []
      const promoCards = filterPromoCards({
        accountReferral,
        cards,
        countryCode,
        buildNumber: getBuildNumber(),
        osType: Platform.OS,
        version: getVersion(),
        osVersion: getOsVersion(),
        currentDate: new Date()
      })
      const pluginPromos = promoCards.map(card => card.pluginPromotions ?? []).flat()
      const filteredPromos = pluginPromos.filter(promo => {
        const pluginIdMatch = (promo.pluginIds ?? []).some(pid => pid === pluginId)
        return pluginIdMatch && promo.pluginType === direction
      })

      // For lack of a better algo, choose the first promotion that matches
      const pluginPromotion = filteredPromos[0]
      const disableProviders = disablePlugins[pluginId]

      // This should not happen, since we don't show disabled rows:
      if (disableProviders === true) return

      await executePlugin({
        account,
        defaultIsoFiat,
        deviceId,
        direction,
        disablePlugins: disableProviders,
        disklet: coreDisklet,
        forcedWalletResult,
        guiPlugin: plugin,
        longPress,
        navigation,
        paymentType,
        pluginPromotion,
        regionCode: { countryCode, stateProvinceCode },
        onLogEvent
      })
    } else {
      // Launch!
      navigation.navigate(direction === 'buy' ? 'pluginViewBuy' : 'pluginViewSell', {
        plugin,
        deepPath,
        deepQuery
      })
    }

    // Reset potential filterAsset after the user launched a plugin.
    onPluginOpened()
  }

  renderPlugin = ({ item, index }: ListRenderItemInfo<GuiPluginRow>) => {
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
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 30 * (index + 1) }} style={styles.hackContainer}>
        <EdgeCard
          icon={
            <Image
              style={styles.logo}
              // @ts-expect-error
              source={theme[paymentTypeLogosById[item.paymentTypeLogoKey]]}
            />
          }
          onPress={async () => await this.openPlugin(item).catch(error => showError(error))}
          onLongPress={async () => await this.openPlugin(item, true).catch(error => showError(error))}
          paddingRem={[1, 0.5, 1, 0.5]}
        >
          <View style={styles.cardContentContainer}>
            <EdgeText style={styles.titleText} numberOfLines={1}>
              {item.title}
            </EdgeText>
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
        </EdgeCard>
      </EdgeAnim>
    )
  }

  renderTop = () => {
    const { account, countryCode, stateProvinceCode, onCountryPress, theme, forcedWalletResult } = this.props
    const styles = getStyles(theme)
    const direction = this.getSceneDirection()
    const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === countryCode)
    const stateProvinceData = countryData?.stateProvinces?.find(sp => sp['alpha-2'] === stateProvinceCode)
    const uri = `${FLAG_LOGO_URL}/${countryData?.filename || countryData?.name.toLowerCase().replace(' ', '-')}.png`
    const imageSrc = React.useMemo(() => ({ uri }), [uri])
    const hasCountryData = countryData != null

    const countryName = hasCountryData ? countryData.name : lstrings.buy_sell_crypto_select_country_button
    const iconStyle = stateProvinceData == null ? styles.selectedCountryFlag : styles.selectedCountryFlagSelectableRow
    const icon = !hasCountryData ? undefined : <FastImage source={imageSrc} style={iconStyle} />

    const titleAsset =
      forcedWalletResult == null || forcedWalletResult.type !== 'wallet'
        ? lstrings.cryptocurrency
        : getCurrencyCodeWithAccount(account, account.currencyWallets[forcedWalletResult.walletId].currencyInfo.pluginId, forcedWalletResult.tokenId ?? null)

    const countryCard =
      stateProvinceData == null ? (
        <EdgeCard>
          <EdgeRow onPress={onCountryPress} rightButtonType="none" icon={icon} body={countryName} />
        </EdgeCard>
      ) : (
        <SelectableRow onPress={onCountryPress} subTitle={stateProvinceData.name} title={countryData?.name} icon={icon} />
      )

    return (
      <>
        <EdgeAnim style={styles.header} enter={fadeInUp90}>
          <SceneHeader
            title={direction === 'buy' ? sprintf(lstrings.title_plugin_buy_s, titleAsset) : sprintf(lstrings.title_plugin_sell_s, titleAsset)}
            underline
            withTopMargin
          />
        </EdgeAnim>

        {hasCountryData ? (
          <EdgeAnim enter={fadeInUp60} style={styles.hackContainer}>
            <SectionHeader leftTitle={lstrings.title_select_region} />
          </EdgeAnim>
        ) : null}
        <EdgeAnim enter={fadeInUp30} style={styles.hackContainer}>
          {countryCard}
        </EdgeAnim>
        {hasCountryData ? (
          <EdgeAnim enter={fadeInUp20} style={styles.hackContainer}>
            <SectionHeader leftTitle={lstrings.title_select_payment_method} />
          </EdgeAnim>
        ) : null}
      </>
    )
  }

  renderEmptyList = () => {
    const { countryCode, theme } = this.props
    const styles = getStyles(theme)
    if (countryCode === '') return null

    return (
      <View style={styles.emptyPluginContainer}>
        <EdgeText style={styles.emptyPluginText} numberOfLines={2}>
          {lstrings.buy_sell_crypto_no_provider_region}
        </EdgeText>
      </View>
    )
  }

  render() {
    const { accountPlugins, accountReferral, countryCode, stateProvinceCode, developerModeOn, disablePlugins, insetStyle } = this.props
    const direction = this.getSceneDirection()
    const { buy = [], sell = [] } = this.state.buySellPlugins

    // Pick a filter based on our direction:
    let plugins = filterGuiPluginJson(direction === 'buy' ? buy : sell, Platform.OS, countryCode, disablePlugins, stateProvinceCode)

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
      <Animated.FlatList
        data={plugins}
        onScroll={this.props.onScroll}
        ListHeaderComponent={this.renderTop}
        ListEmptyComponent={this.renderEmptyList}
        renderItem={this.renderPlugin}
        keyExtractor={(item: GuiPluginRow) => item.pluginId + item.title}
        contentContainerStyle={insetStyle}
      />
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    marginRight: -theme.rem(0.5),
    // HACK: Required for the header underline to span all the way to the right
    // TODO: Make SceneHeader work right under UI4
    overflow: 'visible'
  },
  cardContentContainer: {
    flexDirection: 'column',
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },
  hackContainer: {
    // HACK: Required for the header underline to span all the way to the right
    // TODO: Make SceneHeader work right under UI4
    paddingHorizontal: theme.rem(0.5)
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
  selectedCountryFlagSelectableRow: {
    height: theme.rem(2),
    width: theme.rem(2),
    borderRadius: theme.rem(1)
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
  const { params = { forcedWalletResult: undefined } } = route
  const dispatch = useDispatch()
  const theme = useTheme()

  const handleScroll = useSceneScrollHandler()
  const account = useSelector(state => state.core.account)
  const accountPlugins = useSelector(state => state.account.referralCache.accountPlugins)
  const accountReferral = useSelector(state => state.account.accountReferral)
  const deviceId = useSelector(state => base58ToUuid(state.core.context.clientId))
  const coreDisklet = useSelector(state => state.core.disklet)
  const { countryCode, defaultIsoFiat, developerModeOn, stateProvinceCode } = useSelector(state => state.ui.settings)
  const direction = props.route.name === 'pluginListSell' ? 'sell' : 'buy'
  const disablePlugins = useSelector(state => state.ui.exchangeInfo[direction].disablePlugins)
  const isFocused = useIsFocused()

  const debouncedNavigation = useAsyncNavigation(navigation)

  const [forcedWalletResultLocal, setForcedWalletResultLocal] = React.useState<WalletListResult | undefined>(params.forcedWalletResult)

  const handleLogEvent = useHandler((event, values) => {
    dispatch(logEvent(event, values))
  })

  const handleCountryPress = useHandler(async () => {
    await dispatch(
      showCountrySelectionModal({
        account,
        countryCode,
        stateProvinceCode
      })
    )
  })
  const handlePluginOpened = useHandler(() => {
    // Reset the temporary 1-time asset filter after opening a plugin.
    // Known issue: We can't resolve the case where the user navigates to this
    // scene with a 'filterAsset,' but does not select a payment method before
    // navigating away.

    setTimeout(() => {
      // Wait a short amount of time for the scene transition animation to
      // complete before we reset the forced asset
      setForcedWalletResultLocal(undefined)
    }, 500)
  })

  React.useEffect(() => {
    // HACK: Latest React Navigation causes multiple mounts
    if (!isFocused) return

    dispatch(checkAndSetRegion({ account, countryCode, stateProvinceCode }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    setForcedWalletResultLocal(params.forcedWalletResult)
  }, [params])

  return (
    <SceneWrapper hasTabs hasNotifications padding={theme.rem(0.5)}>
      {({ insetStyle, undoInsetStyle }) => {
        return (
          <View style={undoInsetStyle}>
            <GuiPluginList
              account={account}
              accountPlugins={accountPlugins}
              accountReferral={accountReferral}
              coreDisklet={coreDisklet}
              countryCode={countryCode}
              defaultIsoFiat={defaultIsoFiat}
              developerModeOn={developerModeOn}
              deviceId={deviceId}
              disablePlugins={disablePlugins}
              forcedWalletResult={forcedWalletResultLocal}
              onScroll={handleScroll}
              insetStyle={insetStyle}
              navigation={debouncedNavigation}
              route={route}
              stateProvinceCode={stateProvinceCode}
              theme={theme}
              onCountryPress={handleCountryPress}
              onLogEvent={handleLogEvent}
              onPluginOpened={handlePluginOpened}
            />
          </View>
        )
      }}
    </SceneWrapper>
  )
})
