import { addBreadcrumb, captureException } from '@sentry/react-native'
import { eq } from 'biggystring'
import { InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { ReturnKeyType, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { showBackupModal } from '../../actions/BackupModalActions'
import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { Fontello } from '../../assets/vector'
import { ENV } from '../../env'
import { useSelectedWallet } from '../../hooks/useSelectedWallet'
import { lstrings } from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { useDispatch } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { consify } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeButton } from '../buttons/EdgeButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { styled } from '../hoc/styled'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { SectionView } from '../layout/SectionView'
import { BackupForTransferModal, BackupForTransferModalResult } from '../modals/BackupModal'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { CountryListModal } from '../modals/CountryListModal'
import { FioCreateHandleModal } from '../modals/FioCreateHandleModal'
import { FlipInputModal2, FlipInputModalResult } from '../modals/FlipInputModal2'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { ScamWarningModal } from '../modals/ScamWarningModal'
import { SurveyModal } from '../modals/SurveyModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts, ExchangedFlipInputRef } from '../themed/ExchangedFlipInput2'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { SimpleTextInput } from '../themed/SimpleTextInput'

interface Props extends EdgeSceneProps<'devTab'> {}

export function DevTestScene(props: Props) {
  const { navigation } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  // TODO: Make this scene work without useSelectedWallet() for unit testing compatibility
  const selectedWallet = useSelectedWallet()
  const walletId = selectedWallet?.wallet.id ?? ''
  const tokenId = selectedWallet?.tokenId ?? null

  const [value0, setValue0] = useState<string>('')
  const [value1, setValue1] = useState<string>('')
  const [filledTextInputValue, setFilledTextInputValue] = useState<string>('')
  const [filledTextInputValue2, setFilledTextInputValue2] = useState<string>('')
  const [filledTextInputValue3, setFilledTextInputValue3] = useState<string>('')
  const [filledTextInputValue4, setFilledTextInputValue4] = useState<string>('')
  const [filledTextInputValue5, setFilledTextInputValue5] = useState<string>('')
  const [filledTextInputValue6, setFilledTextInputValue6] = useState<string>('')
  const [filledTextInputValue7, setFilledTextInputValue7] = useState<string>('')
  const [filledTextInputValue8, setFilledTextInputValue8] = useState<string>('')
  const [deepLinkInputValue, setDeepLinkInputValue] = useState<string>(`edge://scene/manageTokens?walletId=${walletId}`)

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

  const handleMultilineTextInputModal = () => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal title="TextInputModal" inputLabel="Input Value" message="This is a multiline TextInputModal" multiline bridge={bridge} />
    )).catch(error => console.log(error))
  }

  const handleTextInputModal = () => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal title="TextInputModal" inputLabel="Input Value" message="This is a single line TextInputModal" bridge={bridge} />
    )).catch(error => console.log(error))
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
        <>
          <SectionHeader leftTitle="Modals" rightNode={<EdgeText>Galore</EdgeText>} />
          <EdgeButton
            label="SurveyModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(bridge => {
                return <SurveyModal bridge={bridge} />
              })
            }}
          />
          <EdgeButton label="TextInputModal (multiline)" marginRem={0.25} onPress={handleMultilineTextInputModal} />
          <EdgeButton label="TextInputModal (single line)" marginRem={0.25} onPress={handleTextInputModal} />
          <EdgeButton label="FlipInputModal2" marginRem={0.25} onPress={handleFlipInputModal} />
          <EdgeButton
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
          <EdgeButton
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
          <EdgeButton
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
          <EdgeButton
            label="CountryListModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<string>(bridge => <CountryListModal bridge={bridge} countryCode="us" />)
              console.debug(test)
            }}
          />
          <EdgeButton
            label="PasswordReminderModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation} />)
            }}
          />
          <EdgeButton
            label="InsufficientFeesModal"
            marginRem={0.25}
            onPress={async () => {
              if (coreWallet == null) return
              await Airship.show(bridge => (
                <InsufficientFeesModal bridge={bridge} coreError={new InsufficientFundsError({ tokenId: null })} navigation={navigation} wallet={coreWallet} />
              ))
            }}
          />
          <EdgeButton
            label="FioCreateHandleModal"
            marginRem={0.25}
            onPress={async () => {
              const isCreateHandle = await Airship.show<boolean>(bridge => <FioCreateHandleModal bridge={bridge} />)
              if (isCreateHandle) {
                const { freeRegApiToken = '', freeRegRefCode = '' } = typeof ENV.FIO_INIT === 'object' ? ENV.FIO_INIT : {}
                navigation.navigate('fioCreateHandle', { freeRegApiToken, freeRegRefCode })
              }
            }}
          />
          <EdgeButton
            label="BackupModal (Long, Original with image)"
            marginRem={0.25}
            onPress={async () => {
              showBackupModal({ navigation, forgetLoginId: 'test' })
            }}
          />
          <EdgeButton
            label="BackupForTransferModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show((bridge: AirshipBridge<BackupForTransferModalResult | undefined>) => {
                return <BackupForTransferModal bridge={bridge} />
              })
            }}
          />
          <EdgeButton
            label="ScamWarningModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show((bridge: AirshipBridge<'yes' | 'no' | undefined>) => {
                return <ScamWarningModal bridge={bridge} />
              })
            }}
          />
        </>
        <AlertCardUi4 title={lstrings.warning_alphanumeric} type="error" />
        <ModalFilledTextInput
          iconComponent={SearchIconAnimated}
          value={filledTextInputValue6}
          onChangeText={setFilledTextInputValue6}
          autoFocus={false}
          placeholder="Test big text"
          textsizeRem={1.5}
          maxLength={100}
        />
        <ModalFilledTextInput
          numeric
          value={filledTextInputValue7}
          onChangeText={setFilledTextInputValue7}
          autoFocus={false}
          placeholder="Test big number"
          textsizeRem={1.5}
          maxLength={100}
        />
        <ModalFilledTextInput
          value={filledTextInputValue}
          onChangeText={setFilledTextInputValue}
          autoFocus={false}
          placeholder="Test FilledTextInput"
          maxLength={100}
        />
        <ModalFilledTextInput
          prefix="PRE"
          value={filledTextInputValue2}
          onChangeText={setFilledTextInputValue2}
          autoFocus={false}
          placeholder="Test FilledTextInput"
          maxLength={100}
        />
        <ModalFilledTextInput
          numeric
          value={filledTextInputValue3}
          onChangeText={setFilledTextInputValue3}
          autoFocus={false}
          placeholder="Test FilledTextInput num"
        />
        <ModalFilledTextInput
          numeric
          prefix="$"
          suffix="BTC"
          value={filledTextInputValue4}
          onChangeText={setFilledTextInputValue4}
          autoFocus={false}
          placeholder="Test FilledTextInput num"
          error="Error"
          maxLength={100}
        />
        <ModalFilledTextInput
          prefix="USD"
          suffix="BTC"
          value={filledTextInputValue5}
          onChangeText={setFilledTextInputValue5}
          autoFocus={false}
          placeholder="Test FilledTextInput"
          error="Error"
          maxLength={100}
        />
        <>
          <ModalFilledTextInput
            value={filledTextInputValue8}
            onChangeText={setFilledTextInputValue8}
            autoFocus={false}
            placeholder="Test FilledTextInput Custom Error"
            error={filledTextInputValue8 === '' ? undefined : filledTextInputValue8}
          />
          <EdgeText>Ensure errors above don't push me down</EdgeText>
        </>
        {selectedWallet == null ? null : (
          <EdgeCard>
            <ExchangedFlipInput2
              ref={exchangedFlipInputRef}
              wallet={selectedWallet.wallet}
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
          </EdgeCard>
        )}

        <>
          <SimpleTextInput value={value0} onChangeText={onChangeText0} autoFocus={false} placeholder="Crypto Amount" />
          <EdgeButton label="Set Crypto Amt" onPress={onPress0} />
          <SimpleTextInput value={value1} onChangeText={onChangeText1} autoFocus={false} placeholder="Fiat Amount" />
          <EdgeButton label="Set Fiat Amt" onPress={onPress1} />
        </>

        <>
          <SectionHeader leftTitle="Buttons" />
          <EdgeButton onPress={() => {}} label="Button With Child" marginRem={0.5} type="secondary">
            <Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />
          </EdgeButton>
          <EdgeText>Button with spinner and child (same width as above)</EdgeText>
          <EdgeButton onPress={() => {}} label="Button With Child" marginRem={0.5} type="secondary" spinner>
            <Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />
          </EdgeButton>
          <EdgeButton onPress={() => {}} label="Mini" marginRem={0.5} type="secondary" mini />
          <EdgeText style={{ marginVertical: theme.rem(0.5) }}>ButtonsViews</EdgeText>
          <OutlinedView>
            <ButtonsView
              primary={{ label: 'Primary', onPress: () => {} }}
              secondary={{ label: 'Secondary', onPress: () => {} }}
              tertiary={{ label: 'Tertiary Tertiary Tertiary Tertiary', onPress: () => {} }}
              layout="column"
            />
          </OutlinedView>
          <OutlinedView>
            <ButtonsView
              primary={{ label: 'Primary Primary', onPress: () => {} }}
              secondary={{ label: 'Secondary', onPress: () => {} }}
              tertiary={{ label: 'Tertiary', onPress: () => {} }}
              layout="column"
            />
          </OutlinedView>
          <OutlinedView>
            <ButtonsView primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} layout="row" />
          </OutlinedView>
          <OutlinedView>
            <ButtonsView secondary={{ label: 'Secondary', onPress: () => {} }} secondary2={{ label: 'Secondary', onPress: () => {} }} layout="row" />
          </OutlinedView>

          <EdgeText style={{ marginVertical: theme.rem(0.5) }}>Loose Buttons (0.5rem margin)</EdgeText>
          <OutlinedView>
            <EdgeButton marginRem={0.5} onPress={() => {}} label="Mini" type="secondary" mini />
            <EdgeButton marginRem={0.5} onPress={() => {}} label="Mini" type="secondary" mini />
          </OutlinedView>
          <OutlinedView>
            <EdgeButton marginRem={0.5} onPress={() => {}} label="Primary" type="primary" />
            <EdgeButton marginRem={0.5} onPress={() => {}} label="Secondary" type="secondary" />
            <EdgeButton marginRem={0.5} onPress={() => {}} label="Tertiary" type="tertiary" />
          </OutlinedView>
        </>
        <>
          <SectionHeader leftTitle="DeepLinking" />
          <ModalFilledTextInput
            value={deepLinkInputValue}
            onChangeText={setDeepLinkInputValue}
            autoFocus={false}
            placeholder="DeepLink"
            error={filledTextInputValue8 === '' ? undefined : filledTextInputValue8}
          />
          <EdgeButton
            marginRem={0.5}
            onPress={() => {
              const parsed = parseDeepLink(deepLinkInputValue)
              console.debug('parsed deeplink: ', parsed)
              dispatch(launchDeepLink(navigation, parsed)).catch(e => showError(e))
            }}
            label="Activate DeepLink"
            type="primary"
          />
        </>
        <>
          <SectionHeader leftTitle="Crash Reporting" />
          <EdgeButton
            marginRem={0.5}
            onPress={() => {
              addBreadcrumb({
                type: 'DEV_ERROR',
                message: 'Test Breadcrumb before error',
                timestamp: new Date().getTime() / 1000
              })
              captureException(new Error('First error'))
            }}
            label="Crash"
            type="primary"
          />
        </>
      </SectionView>
    </SceneWrapper>
  )
}

const OutlinedView = styled(View)({
  borderWidth: 1,
  borderColor: 'white',
  alignItems: 'center',
  justifyContent: 'center'
})
