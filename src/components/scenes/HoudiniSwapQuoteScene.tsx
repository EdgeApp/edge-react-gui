import type { EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { SceneContainer } from '../layout/SceneContainer'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'

export interface HoudiniSwapQuoteParams {
  walletId: string
  fromCode: string
  toCode: string
  toPluginId: string
  fromAmount: string
  toAmount: string
  ratePerBtc: string
  networkFee: string
  incognito: boolean
}

interface Props extends EdgeAppSceneProps<'houdiniSwapQuote'> {}

const ESTIMATE_PREFIX = '~ '

export const HoudiniSwapQuoteScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const {
    walletId,
    fromCode,
    toCode,
    toPluginId,
    fromAmount,
    toAmount,
    ratePerBtc,
    networkFee
  } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const isSubmitting = React.useRef(false)
  const rateText = `1 ${fromCode} = ${ratePerBtc} ${toCode}`

  const handleConfirm = useHandler((reset: () => void) => {
    if (isSubmitting.current) return
    isSubmitting.current = true
    // The slider is intentionally not reset before navigating away, so it locks
    // and a second slide cannot fire another navigation.
    navigation.navigate('swapSuccess', {
      edgeTransaction: buildPrototypeTransaction(walletId, fromCode),
      walletId
    })
  })

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={lstrings.houdini_quote_title}>
        <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
          <EdgeCard sections>
            <EdgeRow title={lstrings.houdini_you_send}>
              <View style={styles.assetRow}>
                <CryptoIcon
                  pluginId="bitcoin"
                  tokenId={null}
                  sizeRem={1.5}
                  marginRem={[0, 0.5, 0, 0]}
                />
                <EdgeText>{`${fromAmount} ${fromCode}`}</EdgeText>
              </View>
            </EdgeRow>
            <EdgeRow title={lstrings.houdini_you_receive}>
              <View style={styles.assetRow}>
                <CryptoIcon
                  pluginId={toPluginId}
                  tokenId={null}
                  sizeRem={1.5}
                  marginRem={[0, 0.5, 0, 0]}
                />
                <EdgeText>{`${ESTIMATE_PREFIX}${toAmount} ${toCode}`}</EdgeText>
              </View>
            </EdgeRow>
          </EdgeCard>

          <EdgeCard sections>
            <EdgeRow title={lstrings.houdini_rate} body={rateText} />
            <EdgeRow
              title={lstrings.wc_smartcontract_network_fee}
              body={networkFee}
            />
          </EdgeCard>

          {/* "Powered by" indicator with no chevron (not tappable). */}
          <EdgeCard>
            <View style={styles.poweredByRow}>
              <EdgeText style={styles.poweredByText}>
                {`${lstrings.plugin_powered_by_space}${lstrings.houdini_provider_name}`}
              </EdgeText>
            </View>
          </EdgeCard>
        </EdgeAnim>

        <View style={styles.sliderContainer}>
          <SafeSlider
            disabled={false}
            confirmText={lstrings.houdini_slide_swap}
            onSlidingComplete={handleConfirm}
          />
        </View>
      </SceneContainer>
    </SceneWrapper>
  )
}

/**
 * Hard-coded, display-only transaction so the success scene has something to
 * render. It is never broadcast.
 */
function buildPrototypeTransaction(
  walletId: string,
  currencyCode: string
): EdgeTransaction {
  return {
    tokenId: null,
    nativeAmount: '-10000000',
    networkFees: [],
    blockHeight: 0,
    date: 1700000000,
    txid: 'houdini-prototype-swap',
    signedTx: '',
    memos: [],
    ourReceiveAddresses: [],
    isSend: true,
    walletId,
    currencyCode,
    networkFee: '2000'
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.rem(0.5)
  },
  poweredByText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  sliderContainer: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(2),
    alignItems: 'center'
  }
}))
