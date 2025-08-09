import * as React from 'react'

// TradeOptionSelectScene - Updated layout for design requirements
import { lstrings } from '../../locales/strings'
import type { BuyTabSceneProps } from '../../types/routerTypes'
import { PaymentOptionCard } from '../cards/PaymentOptionCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { BestRateBadge } from '../icons/BestRateBadge'
import { SceneContainer } from '../layout/SceneContainer'
import { useTheme } from '../services/ThemeContext'

export interface RampSelectOptionParams {}

interface Props extends BuyTabSceneProps<'rampSelectOption'> {}

// Demo constants for design phase
const DEMO_TOTAL_AMOUNT_LABEL = 'Total: Total Amount'
const DEMO_SETTLEMENT_TIME_LABEL = 'Settlement: 5 min - 24 hours'
const DEMO_CREDIT_DEBIT_LABEL = 'Credit/Debit'
const DEMO_PAYPAL_METHOD_LABEL = 'Paypal'
const DEMO_APPLE_PAY_METHOD_LABEL = 'Apple Pay'

export const TradeOptionSelectScene = (props: Props): React.JSX.Element => {
  const theme = useTheme()
  const handlePayPalPress = (): void => {
    // TODO: Navigate to PayPal/MoonPay
  }

  const handleApplePayPress = (): void => {
    // TODO: Navigate to Apple Pay/Simplex
  }

  const handleCreditDebitPress = (): void => {
    // TODO: Navigate to Credit/Debit/Paybis
  }

  const handleMoonPayPress = (): void => {
    // TODO: Open MoonPay
  }

  const handleSimplexPress = (): void => {
    // TODO: Open Simplex
  }

  const handlePaybisPress = (): void => {
    // TODO: Open Paybis
  }

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={lstrings.trade_option_buy_title}>
        <SectionHeader
          leftTitle={lstrings.trade_option_select_payment_method}
        />

        <PaymentOptionCard
          title={DEMO_PAYPAL_METHOD_LABEL}
          icon={theme.guiPluginLogoMoonpay}
          totalAmount={DEMO_TOTAL_AMOUNT_LABEL}
          settlementTime={DEMO_SETTLEMENT_TIME_LABEL}
          partner={{
            displayName: 'MoonPay',
            icon: theme.guiPluginLogoMoonpay
          }}
          onPress={handlePayPalPress}
          onProviderPress={handleMoonPayPress}
          renderRight={() => <BestRateBadge />}
        />

        <PaymentOptionCard
          title={DEMO_APPLE_PAY_METHOD_LABEL}
          icon={{
            uri: ''
          }}
          totalAmount={DEMO_TOTAL_AMOUNT_LABEL}
          settlementTime={DEMO_SETTLEMENT_TIME_LABEL}
          partner={{
            displayName: 'Simplex',
            icon: {
              uri: ''
            }
          }}
          onPress={handleApplePayPress}
          onProviderPress={handleSimplexPress}
        />

        <PaymentOptionCard
          title={DEMO_CREDIT_DEBIT_LABEL}
          icon={theme.paymentTypeVisa}
          totalAmount={DEMO_TOTAL_AMOUNT_LABEL}
          settlementTime={DEMO_SETTLEMENT_TIME_LABEL}
          partner={{
            displayName: 'Paybis',
            icon: {
              uri: ''
            }
          }}
          onPress={handleCreditDebitPress}
          onProviderPress={handlePaybisPress}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}
