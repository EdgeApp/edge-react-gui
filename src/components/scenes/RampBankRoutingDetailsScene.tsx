import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SceneContainer } from '../layout/SceneContainer'
import { useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'

export interface BankInfo {
  name: string
  accountNumber: string
  routingNumber: string
}

export interface RampBankRoutingDetailsParams {
  bank: BankInfo
  fiatCurrencyCode: string
  fiatAmount: string
}

interface Props extends EdgeAppSceneProps<'rampBankRoutingDetails'> {}

export const RampBankRoutingDetailsScene = (
  props: Props
): React.JSX.Element => {
  const { navigation, route } = props
  const { bank, fiatCurrencyCode, fiatAmount } = route.params

  const amountToSendText = `${fiatAmount} ${fiatCurrencyCode}`

  const theme = useTheme()

  const handleDone = useHandler((): void => {
    navigation.goBack()
  })

  const InfoRow = ({
    label,
    value
  }: {
    label: string
    value: string
  }): React.JSX.Element => (
    <InfoRowContainer>
      <InfoLabel>{label}</InfoLabel>
      <InfoValue selectable>{value}</InfoValue>
    </InfoRowContainer>
  )

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={lstrings.ramp_bank_routing_title}>
        <ContentContainer>
          <InstructionContainer>
            <StyledIcon
              name="information-circle-outline"
              size={theme.rem(2.5)}
              color={theme.primaryText}
            />
            <Paragraph fit>{lstrings.ramp_bank_routing_instructions}</Paragraph>
          </InstructionContainer>

          <EdgeCard>
            <CardContent>
              <AmountLabel>{lstrings.ramp_send_amount_label}</AmountLabel>
              <AmountValue>{amountToSendText}</AmountValue>
            </CardContent>
          </EdgeCard>

          <EdgeCard>
            <CardContent>
              <SectionTitle>
                {lstrings.ramp_bank_details_section_title}
              </SectionTitle>

              <InfoRow
                label={lstrings.ramp_bank_name_label}
                value={bank.name}
              />
              <InfoRow
                label={lstrings.ramp_account_number_label}
                value={bank.accountNumber}
              />
              <InfoRow
                label={lstrings.ramp_routing_number_label}
                value={bank.routingNumber}
              />
            </CardContent>
          </EdgeCard>

          <WarningTextContainer>
            <WarningText>{lstrings.ramp_bank_routing_warning}</WarningText>
          </WarningTextContainer>
        </ContentContainer>

        <SceneButtons
          primary={{
            label: lstrings.string_done_cap,
            onPress: handleDone
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}

// Styled components
const ContentContainer = styled(View)(theme => ({
  flex: 1,
  paddingHorizontal: theme.rem(0.5)
}))

const InstructionContainer = styled(View)(theme => ({
  alignItems: 'center',
  flexDirection: 'row',
  paddingVertical: theme.rem(0.5),
  paddingHorizontal: theme.rem(0.5)
}))

const StyledIcon = styled(IonIcon)(theme => ({
  marginBottom: theme.rem(0.5)
}))

const CardContent = styled(View)(theme => ({
  padding: theme.rem(1)
}))

const AmountLabel = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.75),
  color: theme.secondaryText,
  marginBottom: theme.rem(0.25)
}))

const AmountValue = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1.5),
  fontFamily: theme.fontFaceBold,
  color: theme.primaryText
}))

const SectionTitle = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1),
  fontFamily: theme.fontFaceMedium,
  marginBottom: theme.rem(1)
}))

const InfoRowContainer = styled(View)(theme => ({
  marginBottom: theme.rem(0.75)
}))

const InfoLabel = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.75),
  color: theme.secondaryText,
  marginBottom: theme.rem(0.25)
}))

const InfoValue = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1),
  fontFamily: theme.fontFaceMedium,
  color: theme.primaryText
}))

const WarningTextContainer = styled(View)(theme => ({
  paddingHorizontal: theme.rem(1)
}))

const WarningText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.75),
  fontStyle: 'italic',
  textAlign: 'center'
}))
