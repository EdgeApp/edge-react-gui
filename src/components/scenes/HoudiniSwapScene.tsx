import { mul } from 'biggystring'
import type { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { SceneContainer } from '../layout/SceneContainer'
import { RadioListModal } from '../modals/RadioListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { EdgeText } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'

export interface HoudiniSwapParams {
  walletId: string
  tokenId: EdgeTokenId
}

interface Props extends EdgeAppSceneProps<'houdiniSwap'> {}

// A hard-coded swap-destination chain for the prototype; nothing talks to Houdini.
interface SwapChain {
  pluginId: string
  currencyCode: string
  displayName: string
  ratePerBtc: string
  conversionPercent: string
}

const SOURCE_CHAIN: SwapChain = {
  pluginId: 'bitcoin',
  currencyCode: 'BTC',
  displayName: 'Bitcoin',
  ratePerBtc: '1',
  conversionPercent: '-1'
}

const TO_CHAINS: SwapChain[] = [
  {
    pluginId: 'monero',
    currencyCode: 'XMR',
    displayName: 'Monero',
    ratePerBtc: '350',
    conversionPercent: '-2.5'
  },
  {
    pluginId: 'ethereum',
    currencyCode: 'ETH',
    displayName: 'Ethereum',
    ratePerBtc: '36.5',
    conversionPercent: '-1.8'
  },
  {
    pluginId: 'solana',
    currencyCode: 'SOL',
    displayName: 'Solana',
    ratePerBtc: '620',
    conversionPercent: '-2'
  }
]

const HARD_CODED_NETWORK_FEE = '0.00002 BTC'
const ESTIMATE_PREFIX = '~ '
const amountRegex = /^\d*\.?\d*$/

export const HoudiniSwapScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { walletId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const [toChain, setToChain] = React.useState<SwapChain>(TO_CHAINS[0])
  const [fromAmount, setFromAmount] = React.useState('0.1')
  const [toAmount, setToAmount] = React.useState(
    mul('0.1', TO_CHAINS[0].ratePerBtc)
  )
  const [incognito, setIncognito] = React.useState(false)

  const sourceWallet = useSelector(
    state => state.core.account.currencyWallets[walletId]
  )

  const conversionPercentText = `${toChain.conversionPercent}%`

  const handleEditFrom = useHandler(async () => {
    const result = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.houdini_you_send}
        initialValue={fromAmount}
        keyboardType="decimal-pad"
        submitLabel={lstrings.string_ok}
      />
    ))
    if (result == null || !amountRegex.test(result) || result === '') return
    setFromAmount(result)
    setToAmount(mul(result, toChain.ratePerBtc))
  })

  const handlePickTo = useHandler(async () => {
    const code = await Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title={lstrings.houdini_swap_to}
        selected={toChain.currencyCode}
        items={TO_CHAINS.map(chain => ({
          name: chain.currencyCode,
          text: chain.displayName,
          icon: (
            <CryptoIcon
              pluginId={chain.pluginId}
              tokenId={null}
              sizeRem={1.5}
            />
          )
        }))}
      />
    ))
    if (code == null) return
    const next = TO_CHAINS.find(chain => chain.currencyCode === code)
    if (next == null) return
    setToChain(next)
    setToAmount(mul(fromAmount, next.ratePerBtc))
  })

  const handleToggleIncognito = useHandler(() => {
    setIncognito(value => !value)
  })

  const handleGetQuote = useHandler((reset: () => void) => {
    // Hard-coded estimate; nothing talks to Houdini.
    navigation.navigate('houdiniSwapQuote', {
      walletId,
      fromCode: SOURCE_CHAIN.currencyCode,
      toCode: toChain.currencyCode,
      toPluginId: toChain.pluginId,
      fromAmount,
      toAmount,
      ratePerBtc: toChain.ratePerBtc,
      networkFee: HARD_CODED_NETWORK_FEE,
      incognito
    })
    reset()
  })

  const renderWalletRow = (
    title: string,
    chain: SwapChain,
    name: string,
    onPress?: () => Promise<void>
  ): React.ReactElement => (
    <EdgeRow
      title={title}
      rightButtonType={onPress == null ? 'none' : 'editable'}
      onPress={onPress}
    >
      <View style={styles.assetRow}>
        <CryptoIcon
          pluginId={chain.pluginId}
          tokenId={null}
          sizeRem={1.5}
          marginRem={[0, 0.5, 0, 0]}
        />
        <EdgeText>{name}</EdgeText>
      </View>
    </EdgeRow>
  )

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={lstrings.houdini_swap_title}>
        <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
          <EdgeCard sections>
            {renderWalletRow(
              lstrings.houdini_swap_from_wallet,
              SOURCE_CHAIN,
              sourceWallet?.name ?? SOURCE_CHAIN.displayName
            )}
            <EdgeRow
              rightButtonType="editable"
              title={lstrings.houdini_you_send}
              onPress={handleEditFrom}
            >
              <EdgeText style={styles.amountText}>
                {`${fromAmount} ${SOURCE_CHAIN.currencyCode}`}
              </EdgeText>
            </EdgeRow>
          </EdgeCard>

          <EdgeCard sections>
            {renderWalletRow(
              lstrings.houdini_swap_to_wallet,
              toChain,
              toChain.displayName,
              handlePickTo
            )}
            <EdgeRow title={lstrings.houdini_you_receive}>
              <View style={styles.amountRow}>
                <EdgeText style={styles.amountText}>
                  {`${ESTIMATE_PREFIX}${toAmount} ${toChain.currencyCode}`}
                </EdgeText>
                <EdgeText style={styles.percentHint}>
                  {conversionPercentText}
                </EdgeText>
              </View>
            </EdgeRow>
          </EdgeCard>

          <EdgeCard sections>
            <SettingsSwitchRow
              label={lstrings.houdini_incognito_send}
              value={incognito}
              onPress={handleToggleIncognito}
            />
            {incognito ? (
              <View style={styles.incognitoInfo}>
                <EdgeText style={styles.incognitoInfoText} numberOfLines={4}>
                  {lstrings.houdini_incognito_info}
                </EdgeText>
              </View>
            ) : null}
          </EdgeCard>
        </EdgeAnim>

        <View style={styles.sliderContainer}>
          <SafeSlider
            disabled={false}
            confirmText={lstrings.houdini_slide_get_quote}
            onSlidingComplete={handleGetQuote}
          />
        </View>
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  amountText: {
    marginRight: theme.rem(0.5)
  },
  percentHint: {
    color: theme.negativeText,
    fontSize: theme.rem(0.75)
  },
  incognitoInfo: {
    paddingHorizontal: theme.rem(0.5),
    paddingBottom: theme.rem(0.25)
  },
  incognitoInfoText: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  },
  sliderContainer: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(2),
    alignItems: 'center'
  }
}))
