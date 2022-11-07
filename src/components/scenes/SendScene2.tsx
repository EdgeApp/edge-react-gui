import { EdgeAccount, EdgeSpendInfo, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useExchangeDenom } from '../../hooks/useExchangeDenom'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { RouteProp } from '../../types/routerTypes'
import { GuiExchangeRates } from '../../types/types'
import { getCurrencyCode, getTokenId } from '../../util/CurrencyInfoHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { FlipInputModal2, FlipInputModalRef, FlipInputModalResult } from '../modals/FlipInputModal2'
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { ExchangedFlipInputAmounts, ExchangeFlipInputFields } from '../themed/ExchangedFlipInput2'
import { AddressTile, ChangeAddressResult } from '../tiles/AddressTile'
import { EditableAmountTile } from '../tiles/EditableAmountTile'
import { Tile } from '../tiles/Tile'

type Props = {
  // navigation: NavigationProp<'send2'>
  route: RouteProp<'send2'>
}

const blankSpendInfo: EdgeSpendInfo = {
  spendTargets: [{}]
}

const SendComponent = React.memo((props: Props) => {
  const { route } = props
  const theme = useTheme()

  const flipInputModalRef = React.useRef<FlipInputModalRef>(null)
  const { walletId: initWalletId = '', tokenId: tokenIdProp, spendInfo: initSpendInfo, openCamera } = route.params

  const [walletId] = useState<string>(initWalletId)
  const [spendInfo, setSpendInfo] = useState<EdgeSpendInfo>(initSpendInfo ?? blankSpendInfo)
  const [fieldChanged, setFieldChanged] = useState<ExchangeFlipInputFields>('fiat')
  const [feeNativeAmount, setFeeNativeAmount] = useState<string>('')
  const [edgeTransaction, setEdgeTransaction] = useState<EdgeTransaction | null>(null)
  console.log(edgeTransaction?.currencyCode ?? '')

  const account = useSelector<EdgeAccount>(state => state.core.account)
  const exchangeRates = useSelector<GuiExchangeRates>(state => state.exchangeRates)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyCode = spendInfo?.currencyCode ?? currencyWallets[walletId].currencyInfo.currencyCode
  const { pluginId } = currencyWallets[walletId].currencyInfo
  const cryptoDisplayDenomination = useDisplayDenom(pluginId, currencyCode)
  const cryptoExchangeDenomination = useExchangeDenom(pluginId, currencyCode)
  const coreWallet = currencyWallets[walletId]

  const { lockTilesMap = {}, hiddenTilesMap = {} } = route.params
  const tokenId = tokenIdProp ?? getTokenId(account, pluginId, currencyCode)
  spendInfo.currencyCode = getCurrencyCode(coreWallet, tokenId)

  const handleChangeAddress = useHandler((spendTarget: EdgeSpendTarget) => async (changeAddressResult: ChangeAddressResult): Promise<void> => {
    spendTarget.publicAddress = changeAddressResult.parsedUri?.publicAddress ?? ''

    // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
    // should properly re-render with new spendTargets
    setSpendInfo({ ...spendInfo })
  })

  const handleAddressAmountPress = useHandler((index: number) => () => {
    spendInfo.spendTargets.splice(index, 1)
    setSpendInfo({ ...spendInfo })
  })

  const renderAddressAmountTile = useHandler((index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    return (
      <EditableAmountTile
        title={`Send To ${publicAddress}`}
        exchangeRates={exchangeRates}
        nativeAmount={nativeAmount ?? ''}
        wallet={coreWallet}
        currencyCode={currencyCode}
        exchangeDenomination={cryptoExchangeDenomination}
        displayDenomination={cryptoDisplayDenomination}
        lockInputs={lockTilesMap.amount ?? false}
        compressed
        // TODO: Handle press
        onPress={handleAddressAmountPress(index)}
      />
    )
  })

  const renderAddressTile = useHandler((index: number, spendTarget: EdgeSpendTarget) => {
    if (coreWallet != null && !hiddenTilesMap.address) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '' } = spendTarget
      const title = s.strings.send_scene_send_to_address + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <AddressTile
          title={title}
          recipientAddress={publicAddress}
          coreWallet={coreWallet}
          currencyCode={currencyCode}
          onChangeAddress={handleChangeAddress(spendTarget)}
          resetSendTransaction={() => {
            spendTarget.publicAddress = undefined
            spendTarget.nativeAmount = undefined
            setSpendInfo({ ...spendInfo })
          }}
          lockInputs={lockTilesMap.address}
          isCameraOpen={!!openCamera}
          ref={() => {}}
        />
      )
    }

    return null
  })

  const handleAmountsChanged = useHandler((spendTarget: EdgeSpendTarget) => (amounts: ExchangedFlipInputAmounts) => {
    const { nativeAmount, fieldChanged: newField } = amounts
    spendTarget.nativeAmount = nativeAmount === '' ? undefined : nativeAmount

    // This works since the spendTarget object is guaranteed to be inside
    // the spendInfo object
    setSpendInfo({ ...spendInfo })
    setFieldChanged(newField)
  })

  const handleFlipInputModal = useHandler((spendTarget: EdgeSpendTarget) => () => {
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        ref={flipInputModalRef}
        bridge={bridge}
        startNativeAmount={spendTarget.nativeAmount}
        forceField={fieldChanged}
        onAmountsChanged={handleAmountsChanged(spendTarget)}
        onMaxSet={() => undefined}
        onFeesChange={() => undefined}
        walletId={walletId}
        tokenId={tokenId}
        feeNativeAmount={feeNativeAmount}
      />
    )).catch(error => console.log(error))
  })

  const renderAmount = useHandler((index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && !hiddenTilesMap.amount) {
      const title = s.strings.fio_request_amount + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <EditableAmountTile
          title={title}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? ''}
          wallet={coreWallet}
          currencyCode={currencyCode}
          exchangeDenomination={cryptoExchangeDenomination}
          displayDenomination={cryptoDisplayDenomination}
          lockInputs={lockTilesMap.amount ?? false}
          // TODO: Handle press
          onPress={handleFlipInputModal(spendTarget)}
        />
      )
    }

    return null
  })

  const renderAddressAmountPairs = useHandler(() => {
    const out: Array<JSX.Element | null> = []
    for (let i = 0; i < spendInfo.spendTargets.length; i++) {
      const spendTarget = spendInfo.spendTargets[i]
      let element
      if (i < spendInfo.spendTargets.length - 1) {
        element = renderAddressAmountTile(i, spendTarget)
        if (element != null) out.push(element)
      } else {
        element = renderAddressTile(i, spendTarget)
        if (element != null) out.push(element)
        element = renderAmount(i, spendTarget)
        if (element != null) out.push(element)
      }
    }
    return out
  })

  const handleAddAddress = useHandler(() => {
    spendInfo.spendTargets.push({})
    setSpendInfo({ ...spendInfo })
  })

  const renderAddAddress = useHandler(() => {
    const type = coreWallet.type
    const maxSpendTargets = getSpecialCurrencyInfo(type)?.maxSpendTargets ?? 1
    if (maxSpendTargets < 2 || hiddenTilesMap.address || hiddenTilesMap.amount || lockTilesMap.address || lockTilesMap.amount) {
      return null
    }
    const numTargets = spendInfo.spendTargets.length
    const lastTargetHasAddress = spendInfo.spendTargets[numTargets - 1].publicAddress != null
    const lastTargetHasAmount = spendInfo.spendTargets[numTargets - 1].nativeAmount != null
    if (lastTargetHasAddress && lastTargetHasAmount) {
      return <Tile type="touchable" title={s.strings.send_add_destination_address} onPress={handleAddAddress} maximumHeight="small" contentPadding />
    } else {
      return null
    }
  })

  useAsyncEffect(async () => {
    if (spendInfo.spendTargets[0].nativeAmount == null) {
      flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
      return
    }
    try {
      const edgeTx = await coreWallet.makeSpend(spendInfo)
      setEdgeTransaction(edgeTx)
      const { parentNetworkFee, networkFee } = edgeTx
      const feeNativeAmount = parentNetworkFee ?? networkFee
      const feeTokenId = parentNetworkFee == null ? tokenId : undefined
      setFeeNativeAmount(feeNativeAmount)
      flipInputModalRef.current?.setFees({ feeTokenId, feeNativeAmount })
      flipInputModalRef.current?.setError(null)
    } catch (e: any) {
      flipInputModalRef.current?.setError(e.message)
      flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
    }
  }, [spendInfo])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {renderAddressAmountPairs()}
        {renderAddAddress()}
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
})

export const SendScene2 = React.memo(SendComponent)
