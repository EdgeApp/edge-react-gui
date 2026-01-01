import { useNavigation } from '@react-navigation/native'
import { addBreadcrumb, captureException } from '@sentry/react-native'
import { eq } from 'biggystring'
import { type EdgeCurrencyWallet, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { type ReturnKeyType, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { showBackupModal } from '../../actions/BackupModalActions'
import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { Fontello } from '../../assets/vector'
import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import type { HomeAddress } from '../../types/FormTypes'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type {
  EdgeTabsSceneProps,
  NavigationBase
} from '../../types/routerTypes'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { consify } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeButton } from '../buttons/EdgeButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { AirshipToast } from '../common/AirshipToast'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { styled } from '../hoc/styled'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { SectionView } from '../layout/SectionView'
import {
  BackupForTransferModal,
  type BackupForTransferModalResult
} from '../modals/BackupModal'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { CountryListModal } from '../modals/CountryListModal'
import { FioCreateHandleModal } from '../modals/FioCreateHandleModal'
import {
  FlipInputModal2,
  type FlipInputModalResult
} from '../modals/FlipInputModal2'
import { showInsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { ScamWarningModal } from '../modals/ScamWarningModal'
import { SurveyModal } from '../modals/SurveyModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import {
  ExchangedFlipInput2,
  type ExchangedFlipInputAmounts,
  type ExchangedFlipInputRef
} from '../themed/ExchangedFlipInput2'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { SceneHeader } from '../themed/SceneHeader'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'
import { SimpleTextInput } from '../themed/SimpleTextInput'

type Props = EdgeTabsSceneProps<'devTab'>

export const DevTestScene: React.FC<Props> = props => {
  const { navigation } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  // TODO: Make this scene work without useSelectedWallet() for unit testing compatibility
  const { id: walletId, tokenId } = useSelector(
    state => state.ui.settings.mostRecentWallets[0] ?? { id: '', tokenId: null }
  )
  const account = useSelector(state => state.core.account)
  const wallet: EdgeCurrencyWallet | undefined =
    account.currencyWallets[walletId]

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
  const [deepLinkInputValue, setDeepLinkInputValue] = useState<string>(
    `edge://scene/manageTokens?walletId=${walletId}`
  )

  const exchangedFlipInputRef = React.useRef<ExchangedFlipInputRef>(null)

  const onAmountChanged = (amounts: ExchangedFlipInputAmounts): void => {
    consify(amounts)
  }

  const onPress0 = (): void => {
    exchangedFlipInputRef.current?.setAmount('crypto', value0)
  }
  const onChangeText0 = (text: string): void => {
    setValue0(text)
  }
  const onPress1 = (): void => {
    exchangedFlipInputRef.current?.setAmount('fiat', value1)
  }
  const onChangeText1 = (text: string): void => {
    setValue1(text)
  }

  const onAmountsChanged = (amounts: ExchangedFlipInputAmounts): void => {
    console.log(JSON.stringify(amounts, null, 2))
  }

  const handleToastAllowFontScaling = (): void => {
    Airship.show(bridge => (
      <AirshipToast
        bridge={bridge}
        message="Toast that ignores iOS accessibility font scaling settings. Very long text to test wrapping and scaling behavior across different font settings."
      />
    )).catch((error: unknown) => {
      console.log(error)
    })
  }

  const handleFlipInputModal = (): void => {
    if (wallet == null) return
    Airship.show<FlipInputModalResult>(bridge => {
      if (wallet == null) return null
      return (
        <FlipInputModal2
          bridge={bridge}
          wallet={wallet}
          tokenId={tokenId}
          feeTokenId={null}
          onAmountsChanged={onAmountsChanged}
        />
      )
    }).catch((error: unknown) => {
      console.log(error)
    })
  }

  const handleMultilineTextInputModal = (): void => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        title="TextInputModal"
        inputLabel="Input Value"
        message="This is a multiline TextInputModal"
        multiline
        bridge={bridge}
      />
    )).catch((error: unknown) => {
      console.log(error)
    })
  }

  const handleTextInputModal = (): void => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        title="TextInputModal"
        inputLabel="Input Value"
        message="This is a single line TextInputModal"
        bridge={bridge}
      />
    )).catch((error: unknown) => {
      console.log(error)
    })
  }

  const navigation2 = useNavigation<NavigationBase>()

  const handleAddressFormPress = (): void => {
    navigation2.navigate('buyTab', {
      screen: 'guiPluginAddressForm',
      params: {
        // Add any necessary props here
        countryCode: 'US',
        headerTitle: 'Address Form',
        onSubmit: async (homeAddress: HomeAddress) => {
          console.log('Address submitted:', homeAddress)
          // Handle the submitted address
        },
        onClose: () => {
          console.log('Address form closed')
          // Handle closing the form
        }
      }
    })
  }

  const handleKycFormPress = (): void => {
    navigation2.navigate('buyTab', {
      screen: 'guiPluginContactForm',
      params: {
        headerTitle: 'KYC Information',
        submitButtonText: 'Submit KYC',
        onSubmit: async (
          firstName: string,
          lastName: string,
          email: string
        ) => {
          console.log('KYC submitted:', { firstName, lastName, email })
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000))
          // Navigate back or to next step
          if (navigation2.canGoBack()) navigation2.goBack()
        },
        onClose: () => {
          console.log('KYC form closed')
        }
      } as any // Cast to any since we're using KycFormScene with different params
    })
  }

  let balance = wallet?.balanceMap.get(tokenId) ?? ''
  if (eq(balance, '0')) balance = ''
  const headerText = 'Select Wallet'
  const handleHeaderPress = (): void => {
    console.log('Header pressed')
  }

  // Hack. If wallet name first char is lowercase, start with crypto focused, otherwise default to fiat
  const defaultField =
    (wallet?.name?.charAt(0).toLowerCase() ?? '') ===
    (wallet?.name?.charAt(0) ?? '')

  // Hack. If wallet name 2nd char is lowercase, start with keyboard down
  const keyboardVisible =
    (wallet?.name?.charAt(1).toLowerCase() ?? '') !==
    (wallet?.name?.charAt(1) ?? '')

  const editable =
    (wallet?.name?.charAt(2).toLowerCase() ?? '') ===
    (wallet?.name?.charAt(2) ?? '')
  const returnKeyType: ReturnKeyType = 'done'

  return (
    <SceneWrapper scroll hasTabs hasHeader={false} padding={theme.rem(0.5)}>
      <SceneHeaderUi4 title="Scene Header" />
      <SceneHeader title="Scene Header (Legacy)" underline />
      <SectionView>
        <>
          <SectionHeader leftTitle="Scenes" />
          <EdgeButton
            label="AddressFormScene"
            onPress={handleAddressFormPress}
            marginRem={0.5}
          />
          <EdgeButton
            label="Legacy Buy Flow"
            marginRem={0.25}
            onPress={() => {
              navigation.navigate('buyTab', { screen: 'pluginListBuyOld' })
            }}
          />
          <EdgeButton
            label="Legacy Sell Flow"
            marginRem={0.25}
            onPress={() => {
              navigation.navigate('sellTab', { screen: 'pluginListSellOld' })
            }}
          />
          <EdgeButton
            label="KycFormScene"
            onPress={handleKycFormPress}
            marginRem={0.5}
          />
          <EdgeButton
            label="Review Trigger Test"
            marginRem={0.25}
            onPress={() => {
              navigation.navigate('reviewTriggerTest')
            }}
          />
          <EdgeButton
            label="Ramp Pending KYC Scene"
            marginRem={0.25}
            onPress={() => {
              navigation.navigate('rampPending', {
                title: 'KYC Pending Test',
                initialStatus: {
                  isChecking: true,
                  message: 'KYC is pending'
                },
                onStatusCheck: async () => {
                  // Mock implementation that returns false to keep polling
                  console.log('Checking KYC status...')
                  if (Math.random() > 0.5) {
                    return {
                      isChecking: false,
                      message: 'KYC is complete'
                    }
                  }
                  return {
                    isChecking: true,
                    message: 'KYC is pending'
                  }
                },
                onClose: () => {
                  console.log('KYC scene closed')
                },
                onCancel: () => {
                  console.log('KYC scene cancelled')
                }
              })
            }}
          />
          <EdgeButton
            label="Ramp Bank Details Scene"
            marginRem={0.25}
            onPress={() => {
              navigation.navigate('rampBankForm', {
                countryCode: 'US',
                onSubmit: async (formData: any) => {
                  console.log('Bank details submitted:', formData)
                  // Simulate API call
                  await new Promise(resolve => setTimeout(resolve, 2000))
                },
                onCancel: () => {
                  console.log('Bank form cancelled')
                }
              })
            }}
          />
          <EdgeButton
            label="Ramp Bank Routing Details Scene"
            marginRem={0.25}
            onPress={() => {
              navigation.navigate('rampBankRoutingDetails', {
                bank: {
                  name: 'Test Bank',
                  accountNumber: '1234567890',
                  routingNumber: '987654321'
                },
                fiatCurrencyCode: 'USD',
                fiatAmount: '1,000.00',
                onDone: () => {
                  navigation.goBack()
                }
              })
            }}
          />
        </>
        <>
          <SectionHeader
            leftTitle="Modals"
            rightNode={<EdgeText>Galore</EdgeText>}
          />
          <EdgeButton
            label="SurveyModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(bridge => {
                return <SurveyModal bridge={bridge} />
              })
            }}
          />
          <EdgeButton
            label="TextInputModal (multiline)"
            marginRem={0.25}
            onPress={handleMultilineTextInputModal}
          />
          <EdgeButton
            label="TextInputModal (single line)"
            marginRem={0.25}
            onPress={handleTextInputModal}
          />
          <EdgeButton
            label="FlipInputModal2"
            marginRem={0.25}
            onPress={handleFlipInputModal}
          />
          <EdgeButton
            label="ButtonsModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<
                'test1' | 'test2' | 'test3' | undefined
              >(bridge => (
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
            label="Toast (allowFontScaling)"
            marginRem={0.25}
            onPress={handleToastAllowFontScaling}
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
              const test = await Airship.show<string>(bridge => (
                <CountryListModal bridge={bridge} countryCode="us" />
              ))
              console.debug(test)
            }}
          />
          <EdgeButton
            label="PasswordReminderModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(bridge => (
                <PasswordReminderModal
                  bridge={bridge}
                  navigation={navigation as NavigationBase}
                />
              ))
            }}
          />
          <EdgeButton
            label="InsufficientFeesModal"
            marginRem={0.25}
            onPress={async () => {
              if (wallet == null) return
              await showInsufficientFeesModal({
                coreError: new InsufficientFundsError({ tokenId: null }),
                countryCode: 'US',
                navigation: navigation as NavigationBase,
                wallet
              })
            }}
          />
          <EdgeButton
            label="FioCreateHandleModal"
            marginRem={0.25}
            onPress={async () => {
              const isCreateHandle = await Airship.show<boolean>(bridge => (
                <FioCreateHandleModal bridge={bridge} />
              ))
              if (isCreateHandle) {
                const { freeRegApiToken = '', freeRegRefCode = '' } =
                  typeof ENV.FIO_INIT === 'object' ? ENV.FIO_INIT : {}
                navigation.navigate('fioCreateHandle', {
                  freeRegApiToken,
                  freeRegRefCode
                })
              }
            }}
          />
          <EdgeButton
            label="BackupModal (Long, Original with image)"
            marginRem={0.25}
            onPress={async () => {
              await showBackupModal({
                navigation: navigation as NavigationBase,
                forgetLoginId: 'test'
              })
            }}
          />
          <EdgeButton
            label="BackupForTransferModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(
                (
                  bridge: AirshipBridge<
                    BackupForTransferModalResult | undefined
                  >
                ) => {
                  return <BackupForTransferModal bridge={bridge} />
                }
              )
            }}
          />
          <EdgeButton
            label="ScamWarningModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(
                (bridge: AirshipBridge<'yes' | 'no' | undefined>) => {
                  return <ScamWarningModal bridge={bridge} />
                }
              )
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
            error={
              filledTextInputValue8 === '' ? undefined : filledTextInputValue8
            }
          />
          <EdgeText>Ensure errors above don't push me down</EdgeText>
        </>
        {wallet == null ? null : (
          <EdgeCard>
            <ExchangedFlipInput2
              ref={exchangedFlipInputRef}
              wallet={wallet}
              headerText={headerText}
              editable={editable}
              onHeaderPress={handleHeaderPress}
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
          <SimpleTextInput
            value={value0}
            onChangeText={onChangeText0}
            autoFocus={false}
            placeholder="Crypto Amount"
          />
          <EdgeButton label="Set Crypto Amt" onPress={onPress0} />
          <SimpleTextInput
            value={value1}
            onChangeText={onChangeText1}
            autoFocus={false}
            placeholder="Fiat Amount"
          />
          <EdgeButton label="Set Fiat Amt" onPress={onPress1} />
        </>

        <>
          <SectionHeader leftTitle="Buttons" />
          <EdgeButton
            onPress={() => {}}
            label="Button With Child"
            marginRem={0.5}
            type="secondary"
          >
            <Fontello
              name="help_headset"
              color={theme.iconTappable}
              size={theme.rem(1.5)}
            />
          </EdgeButton>
          <EdgeText>
            Button with spinner and child (same width as above)
          </EdgeText>
          <EdgeButton
            onPress={() => {}}
            label="Button With Child"
            marginRem={0.5}
            type="secondary"
            spinner
          >
            <Fontello
              name="help_headset"
              color={theme.iconTappable}
              size={theme.rem(1.5)}
            />
          </EdgeButton>
          <EdgeButton
            onPress={() => {}}
            label="Mini"
            marginRem={0.5}
            type="secondary"
            mini
          />
          <EdgeText style={{ marginVertical: theme.rem(0.5) }}>
            ButtonsViews
          </EdgeText>
          <OutlinedView>
            <ButtonsView
              primary={{ label: 'Primary', onPress: () => {} }}
              secondary={{ label: 'Secondary', onPress: () => {} }}
              tertiary={{
                label: 'Tertiary Tertiary Tertiary Tertiary',
                onPress: () => {}
              }}
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
            <ButtonsView
              primary={{ label: 'Primary', onPress: () => {} }}
              secondary={{ label: 'Secondary', onPress: () => {} }}
              layout="row"
            />
          </OutlinedView>
          <OutlinedView>
            <ButtonsView
              secondary={{ label: 'Secondary', onPress: () => {} }}
              secondary2={{ label: 'Secondary', onPress: () => {} }}
              layout="row"
            />
          </OutlinedView>

          <EdgeText style={{ marginVertical: theme.rem(0.5) }}>
            Loose Buttons (0.5rem margin)
          </EdgeText>
          <OutlinedView>
            <EdgeButton
              marginRem={0.5}
              onPress={() => {}}
              label="Mini"
              type="secondary"
              mini
            />
            <EdgeButton
              marginRem={0.5}
              onPress={() => {}}
              label="Mini"
              type="secondary"
              mini
            />
          </OutlinedView>
          <OutlinedView>
            <EdgeButton
              marginRem={0.5}
              onPress={() => {}}
              label="Primary"
              type="primary"
            />
            <EdgeButton
              marginRem={0.5}
              onPress={() => {}}
              label="Secondary"
              type="secondary"
            />
            <EdgeButton
              marginRem={0.5}
              onPress={() => {}}
              label="Tertiary"
              type="tertiary"
            />
          </OutlinedView>
        </>
        <>
          <SectionHeader leftTitle="DeepLinking" />
          <ModalFilledTextInput
            value={deepLinkInputValue}
            onChangeText={setDeepLinkInputValue}
            autoFocus={false}
            placeholder="DeepLink"
            error={
              filledTextInputValue8 === '' ? undefined : filledTextInputValue8
            }
          />
          <EdgeButton
            marginRem={0.5}
            onPress={() => {
              const parsed = parseDeepLink(deepLinkInputValue)
              console.debug('parsed deeplink: ', parsed)
              dispatch(
                launchDeepLink(navigation as NavigationBase, parsed)
              ).catch((error: unknown) => {
                showError(error)
              })
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
