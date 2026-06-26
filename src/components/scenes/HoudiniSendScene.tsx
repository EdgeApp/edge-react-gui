import { div, mul } from 'biggystring'
import type { EdgeTokenId, EdgeTransaction } from 'edge-core-js'
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
import { ButtonsModal } from '../modals/ButtonsModal'
import { RadioListModal } from '../modals/RadioListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { EdgeText } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'
import { AddressTile2 } from '../tiles/AddressTile2'

export interface HoudiniSendParams {
  walletId: string
  tokenId: EdgeTokenId
  // Which card grouping to render. The two prototype proposals differ ONLY in
  // this layout; all controls, values, and navigation are identical.
  layout: 'a' | 'b'
}

interface Props extends EdgeAppSceneProps<'houdiniSend'> {}

// A single Houdini-supported recipient chain. Everything here is hard-coded for
// the prototype; nothing talks to Houdini.
interface HoudiniChain {
  pluginId: string
  currencyCode: string
  displayName: string
  // Hard-coded "1 BTC = ratePerBtc <chain>" exchange rate.
  ratePerBtc: string
  // Hard-coded conversion percent shown on the estimated side (swap-scene
  // style, e.g. "-2.5"). Represents the incognito/exchange spread.
  conversionPercent: string
  // Whether this chain needs a destination tag / memo (drives the conditional row).
  memoNeeded: boolean
}

const SOURCE_CHAIN: HoudiniChain = {
  pluginId: 'bitcoin',
  currencyCode: 'BTC',
  displayName: 'Bitcoin',
  ratePerBtc: '1',
  conversionPercent: '-1',
  memoNeeded: false
}

const RECIPIENT_CHAINS: HoudiniChain[] = [
  SOURCE_CHAIN,
  {
    pluginId: 'ethereum',
    currencyCode: 'ETH',
    displayName: 'Ethereum',
    ratePerBtc: '36.5',
    conversionPercent: '-1.8',
    memoNeeded: false
  },
  {
    pluginId: 'monero',
    currencyCode: 'XMR',
    displayName: 'Monero',
    ratePerBtc: '350',
    conversionPercent: '-2.5',
    memoNeeded: true
  },
  {
    pluginId: 'solana',
    currencyCode: 'SOL',
    displayName: 'Solana',
    ratePerBtc: '620',
    conversionPercent: '-2',
    memoNeeded: false
  }
]

// Hard-coded prototype values:
const HARD_CODED_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const HARD_CODED_NETWORK_FEE = '0.00002 BTC'
const HARD_CODED_DESTINATION_TAG = '8675309'
const ESTIMATE_PREFIX = '~ '

const amountRegex = /^\d*\.?\d*$/

export const HoudiniSendScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { walletId, layout } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  // State:
  const [recipientChain, setRecipientChain] =
    React.useState<HoudiniChain>(SOURCE_CHAIN)
  const [youSend, setYouSend] = React.useState('0.1')
  const [recipientGets, setRecipientGets] = React.useState('0.1')
  const [guaranteedSide, setGuaranteedSide] = React.useState<
    'send' | 'receive'
  >('send')
  const [incognito, setIncognito] = React.useState(false)

  // Selectors:
  const sourceWallet = useSelector(
    state => state.core.account.currencyWallets[walletId]
  )

  // Derived values:
  const isCrossAsset = recipientChain.currencyCode !== SOURCE_CHAIN.currencyCode
  // The send routes through Houdini (and so shows the estimated "recipient gets"
  // amount with a conversion percent, and a locked recipient address) only when
  // it is incognito OR converts between assets. A plain same-asset, non-incognito
  // send is an ordinary on-chain send with the normal "add recipient" UI.
  const isExchange = incognito || isCrossAsset
  // Conversion percent shown on the estimated side (instead of a rate tile).
  const conversionPercentText = `${recipientChain.conversionPercent}%`

  // Handlers:
  const handleEditYouSend = useHandler(async () => {
    const result = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.houdini_you_send}
        initialValue={youSend}
        keyboardType="decimal-pad"
        submitLabel={lstrings.string_ok}
      />
    ))
    if (result == null || !amountRegex.test(result) || result === '') return
    setYouSend(result)
    setGuaranteedSide('send')
    setRecipientGets(mul(result, recipientChain.ratePerBtc))
  })

  const handleEditRecipientGets = useHandler(async () => {
    const result = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.houdini_recipient_gets}
        initialValue={recipientGets}
        keyboardType="decimal-pad"
        submitLabel={lstrings.string_ok}
      />
    ))
    if (result == null || !amountRegex.test(result) || result === '') return
    setRecipientGets(result)
    setGuaranteedSide('receive')
    setYouSend(div(result, recipientChain.ratePerBtc, 8))
  })

  const handlePickRecipientChain = useHandler(async () => {
    const selectedCode = await Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title={lstrings.houdini_recipient_receives}
        selected={recipientChain.currencyCode}
        items={RECIPIENT_CHAINS.map(chain => ({
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
    if (selectedCode == null) return
    const nextChain = RECIPIENT_CHAINS.find(
      chain => chain.currencyCode === selectedCode
    )
    if (nextChain == null) return
    setRecipientChain(nextChain)
    // Keep the guaranteed side fixed and recompute the estimated side.
    if (guaranteedSide === 'send') {
      setRecipientGets(mul(youSend, nextChain.ratePerBtc))
    } else {
      setYouSend(div(recipientGets, nextChain.ratePerBtc, 8))
    }
  })

  const handleToggleIncognito = useHandler(() => {
    setIncognito(value => !value)
  })

  const handleSlidingComplete = useHandler(async (reset: () => void) => {
    const edgeTransaction = buildPrototypeTransaction(walletId)
    // Cross-asset or incognito sends celebrate with the swap success scene;
    // a plain same-asset send shows the standard transaction success modal.
    if (isExchange) {
      reset()
      navigation.navigate('swapSuccess', { edgeTransaction, walletId })
      return
    }
    const result = await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.transaction_success}
        message={lstrings.transaction_success_message}
        buttons={{ ok: { label: lstrings.string_ok } }}
      />
    )).catch((err: unknown) => {
      showError(err)
      return undefined
    })
    reset()
    // Only continue to the details scene when the user acknowledges the
    // success modal; dismissing it leaves them on the send scene.
    if (result === 'ok') {
      navigation.navigate('transactionDetails', { edgeTransaction, walletId })
    }
  })

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderFromWallet = (): React.ReactElement => (
    <EdgeRow title={lstrings.send_scene_send_from_wallet}>
      <View style={styles.assetRow}>
        <CryptoIcon
          pluginId={SOURCE_CHAIN.pluginId}
          tokenId={null}
          sizeRem={1.5}
          marginRem={[0, 0.5, 0, 0]}
        />
        <EdgeText>{sourceWallet?.name ?? SOURCE_CHAIN.displayName}</EdgeText>
      </View>
    </EdgeRow>
  )

  const renderAmountRow = (
    title: string,
    amount: string,
    currencyCode: string,
    isGuaranteed: boolean,
    onPress: () => Promise<void>
  ): React.ReactElement => (
    <EdgeRow rightButtonType="editable" title={title} onPress={onPress}>
      <View style={styles.amountRow}>
        <EdgeText style={styles.amountText}>
          {`${isGuaranteed ? '' : ESTIMATE_PREFIX}${amount} ${currencyCode}`}
        </EdgeText>
        {isGuaranteed ? (
          <EdgeText style={styles.guaranteedHint}>
            {lstrings.houdini_guaranteed}
          </EdgeText>
        ) : (
          <EdgeText style={styles.percentHint}>
            {conversionPercentText}
          </EdgeText>
        )}
      </View>
    </EdgeRow>
  )

  const renderYouSend = (): React.ReactElement =>
    renderAmountRow(
      lstrings.houdini_you_send,
      youSend,
      SOURCE_CHAIN.currencyCode,
      guaranteedSide === 'send',
      handleEditYouSend
    )

  const renderRecipientGets = (): React.ReactElement =>
    renderAmountRow(
      lstrings.houdini_recipient_gets,
      recipientGets,
      recipientChain.currencyCode,
      guaranteedSide === 'receive',
      handleEditRecipientGets
    )

  const renderRecipientReceives = (): React.ReactElement => (
    <EdgeRow
      rightButtonType="editable"
      title={lstrings.houdini_recipient_receives}
      onPress={handlePickRecipientChain}
    >
      <View style={styles.assetRow}>
        <CryptoIcon
          pluginId={recipientChain.pluginId}
          tokenId={null}
          sizeRem={1.5}
          marginRem={[0, 0.5, 0, 0]}
        />
        <EdgeText>{recipientChain.displayName}</EdgeText>
      </View>
    </EdgeRow>
  )

  const renderAddress = (): React.ReactElement | null => {
    if (sourceWallet == null) return null
    // A Houdini (incognito/cross-asset) send pre-fills and locks the recipient
    // address; a plain on-chain send shows the standard "add recipient address"
    // affordance (enter / scan / paste) so it matches a normal BTC send.
    return (
      <AddressTile2
        coreWallet={sourceWallet}
        tokenId={null}
        title={lstrings.send_scene_send_to_address}
        recipientAddress={isExchange ? HARD_CODED_ADDRESS : ''}
        lockInputs={isExchange}
        isCameraOpen={false}
        navigation={
          navigation as React.ComponentProps<typeof AddressTile2>['navigation']
        }
        onChangeAddress={async () => {}}
        resetSendTransaction={() => {}}
      />
    )
  }

  const renderNetworkFee = (): React.ReactElement => (
    <EdgeRow title={lstrings.wc_smartcontract_network_fee}>
      <EdgeText>{HARD_CODED_NETWORK_FEE}</EdgeText>
    </EdgeRow>
  )

  const renderDestinationTag = (): React.ReactElement | null => {
    if (!recipientChain.memoNeeded) return null
    return (
      <EdgeRow title={lstrings.memo_destination_tag_title}>
        <EdgeText>{HARD_CODED_DESTINATION_TAG}</EdgeText>
      </EdgeRow>
    )
  }

  // The incognito toggle expands in-tile with explanatory messaging while it is
  // enabled, mirroring the wording planned for the production tooltip.
  const renderIncognitoToggle = (): React.ReactElement => (
    <SettingsSwitchRow
      label={lstrings.houdini_incognito_send}
      value={incognito}
      onPress={handleToggleIncognito}
    />
  )

  const renderIncognitoInfo = (): React.ReactElement => (
    <View style={styles.incognitoInfo}>
      <EdgeText style={styles.incognitoInfoText} numberOfLines={4}>
        {lstrings.houdini_incognito_info}
      </EdgeText>
    </View>
  )

  // ---------------------------------------------------------------------------
  // Layouts — only the card grouping differs between Proposal A and Proposal B.
  // ---------------------------------------------------------------------------

  const renderLayoutA = (): React.ReactElement => (
    <>
      <EdgeCard sections>
        {renderFromWallet()}
        {renderYouSend()}
        {renderNetworkFee()}
      </EdgeCard>
      <EdgeCard sections>
        {renderRecipientReceives()}
        {renderAddress()}
        {isExchange ? renderRecipientGets() : null}
        {renderDestinationTag()}
      </EdgeCard>
      <EdgeCard sections>
        {renderIncognitoToggle()}
        {incognito ? renderIncognitoInfo() : null}
      </EdgeCard>
    </>
  )

  const renderLayoutB = (): React.ReactElement => (
    <>
      <EdgeCard sections>{renderFromWallet()}</EdgeCard>
      <EdgeCard sections>
        {renderAddress()}
        {renderRecipientReceives()}
        {renderYouSend()}
        {isExchange ? renderRecipientGets() : null}
      </EdgeCard>
      <EdgeCard sections>
        {renderIncognitoToggle()}
        {incognito ? renderIncognitoInfo() : null}
      </EdgeCard>
      <EdgeCard sections>
        {renderNetworkFee()}
        {renderDestinationTag()}
      </EdgeCard>
    </>
  )

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={lstrings.houdini_send_title}>
        <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
          {layout === 'a' ? renderLayoutA() : renderLayoutB()}
        </EdgeAnim>
        <View style={styles.sliderContainer}>
          <SafeSlider
            disabled={false}
            confirmText={
              incognito
                ? lstrings.houdini_slide_incognito
                : lstrings.houdini_slide_send
            }
            onSlidingComplete={handleSlidingComplete}
          />
        </View>
      </SceneContainer>
    </SceneWrapper>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a hard-coded, display-only transaction so the prototype's success
 * scenes (SwapSuccessScene / Transaction Details) have something to render.
 * It is never broadcast.
 */
function buildPrototypeTransaction(walletId: string): EdgeTransaction {
  return {
    tokenId: null,
    nativeAmount: '-10000000',
    networkFees: [],
    blockHeight: 0,
    date: 1700000000,
    txid: 'houdini-prototype-transaction',
    signedTx: '',
    memos: [],
    ourReceiveAddresses: [],
    isSend: true,
    walletId,
    currencyCode: 'BTC',
    networkFee: '2000'
  }
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
    marginLeft: theme.rem(0.25),
    marginRight: theme.rem(0.5)
  },
  percentHint: {
    color: theme.negativeText,
    fontSize: theme.rem(0.75)
  },
  guaranteedHint: {
    color: theme.positiveText,
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
