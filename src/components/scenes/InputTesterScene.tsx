import { eq } from 'biggystring'
import { InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { ReturnKeyType } from 'react-native'

import { useSelectedWallet } from '../../hooks/useSelectedWallet'
import { useState } from '../../types/reactHooks'
import { EdgeSceneProps } from '../../types/routerTypes'
import { consify } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { CountryListModal } from '../modals/CountryListModal'
import { FlipInputModal2, FlipInputModalResult } from '../modals/FlipInputModal2'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { Airship } from '../services/AirshipInstance'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts, ExchangedFlipInputRef } from '../themed/ExchangedFlipInput2'
import { FilledTextInput } from '../themed/FilledTextInput'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { ButtonUi4 } from '../ui4/ButtonUi4'
import { CardUi4 } from '../ui4/CardUi4'
import { SectionHeaderUi4 } from '../ui4/SectionHeaderUi4'
import { SectionView } from '../ui4/SectionView'

interface Props extends EdgeSceneProps<'devTab'> {}

export function InputTesterScene(props: Props) {
  const { navigation } = props

  const selectedWallet = useSelectedWallet()
  const [value0, setValue0] = useState<string>('')
  const [value1, setValue1] = useState<string>('')
  const [filledTextInputValue, setFilledTextInputValue] = useState<string>('')
  const walletId = selectedWallet?.wallet.id ?? ''
  const tokenId = selectedWallet?.tokenId ?? null
  const exchangedFlipInputRef = React.useRef<ExchangedFlipInputRef>(null)

  const onAmountChanged = (amounts: ExchangedFlipInputAmounts): void => {
    consify(amounts)
  }

  const onPress0 = () => {
    exchangedFlipInputRef.current?.setAmount('crypto', value0)
  }
  const onChangeText0 = (text: string) => {
    setValue0(text)
  }
  const onPress1 = () => {
    exchangedFlipInputRef.current?.setAmount('fiat', value1)
  }
  const onChangeText1 = (text: string) => {
    setValue1(text)
  }

  const onAmountsChanged = (amounts: ExchangedFlipInputAmounts) => {
    console.log(JSON.stringify(amounts, null, 2))
  }

  const handleFlipInputModal = () => {
    if (selectedWallet == null) return
    Airship.show<FlipInputModalResult>(bridge => {
      if (selectedWallet == null) return null
      return <FlipInputModal2 bridge={bridge} wallet={selectedWallet.wallet} tokenId={tokenId} feeTokenId={null} onAmountsChanged={onAmountsChanged} />
    }).catch(error => console.log(error))
  }

  const coreWallet = selectedWallet?.wallet
  let balance = coreWallet?.balanceMap.get(tokenId) ?? ''
  if (eq(balance, '0')) balance = ''
  const headerText = 'Select Wallet'
  const headerCallback = () => console.log('Header pressed')

  // Hack. If wallet name first char is lowercase, start with crypto focused, otherwise default to fiat
  const defaultField = (coreWallet?.name?.charAt(0).toLowerCase() ?? '') === (coreWallet?.name?.charAt(0) ?? '')

  // Hack. If wallet name 2nd char is lowercase, start with keyboard down
  const keyboardVisible = (coreWallet?.name?.charAt(1).toLowerCase() ?? '') !== (coreWallet?.name?.charAt(1) ?? '')

  const editable = (coreWallet?.name?.charAt(2).toLowerCase() ?? '') === (coreWallet?.name?.charAt(2) ?? '')
  const returnKeyType: ReturnKeyType = 'done'

  return (
    <SceneWrapper scroll hasTabs hasHeader={false}>
      <SectionView marginRem={1}>
        <FilledTextInput
          vertical={1}
          value={filledTextInputValue}
          onChangeText={setFilledTextInputValue}
          autoFocus={false}
          placeholder="Test FilledTextInput"
          maxLength={100}
        />

        <CardUi4>
          <ExchangedFlipInput2
            ref={exchangedFlipInputRef}
            walletId={walletId}
            headerText={headerText}
            editable={editable}
            headerCallback={headerCallback}
            returnKeyType={returnKeyType}
            forceField={defaultField ? 'crypto' : 'fiat'}
            keyboardVisible={keyboardVisible}
            tokenId={tokenId}
            startNativeAmount={balance}
            onAmountChanged={onAmountChanged}
          />
        </CardUi4>

        <>
          <SimpleTextInput vertical={1} value={value0} onChangeText={onChangeText0} autoFocus={false} placeholder="Crypto Amount" />
          <ButtonUi4 label="Set Crypto Amt" onPress={onPress0} />
          <SimpleTextInput vertical={1} value={value1} onChangeText={onChangeText1} autoFocus={false} placeholder="Fiat Amount" />
          <ButtonUi4 label="Set Fiat Amt" onPress={onPress1} />
        </>

        <>
          <SectionHeaderUi4 leftTitle="Modals" rightNode={<EdgeText>Galore</EdgeText>} />
          <ButtonUi4 label="FlipInputModal2" marginRem={0.25} onPress={handleFlipInputModal} />
          <ButtonUi4
            label="ButtonsModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<'test1' | 'test2' | 'test3' | undefined>(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  title="ButtonsModal"
                  message="message message message message message message message"
                  buttons={{
                    test1: { label: 'Long Text Long Text' },
                    test2: { label: 'Long Text' },
                    test3: { label: 'Text' }
                  }}
                />
              ))
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="ConfirmContinueModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<boolean>(bridge => (
                <ConfirmContinueModal
                  bridge={bridge}
                  title="ConfirmContinueModal"
                  body="You agree this modal looks amazing. You agree this modal looks amazing. You agree this modal looks amazing. You agree this modal looks amazing."
                  onPress={async () => true}
                />
              ))
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="ConfirmContinueModal (warn)"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<boolean>(bridge => (
                <ConfirmContinueModal
                  bridge={bridge}
                  title="ConfirmContinueModal (warn)"
                  body="You agree this modal looks amazing."
                  warning
                  onPress={async () => true}
                />
              ))
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="CountryListModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<string>(bridge => <CountryListModal bridge={bridge} countryCode="us" />)
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="PasswordReminderModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation} />)
            }}
          />
          <ButtonUi4
            label="InsufficientFeesModal"
            marginRem={0.25}
            onPress={async () => {
              if (coreWallet == null) return
              await Airship.show(bridge => (
                <InsufficientFeesModal bridge={bridge} coreError={new InsufficientFundsError({ tokenId: null })} navigation={navigation} wallet={coreWallet} />
              ))
            }}
          />
        </>
      </SectionView>
    </SceneWrapper>
  )
}
