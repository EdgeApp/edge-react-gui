import * as React from 'react'
import { Image, View } from 'react-native'
import FastImage from 'react-native-fast-image'

// TradeOptionSelectScene - Updated layout for design requirements
import { lstrings } from '../../locales/strings'
import type { ImageProp } from '../../types/Theme'
import { PillButton } from '../buttons/PillButton'
import { EdgeCard } from '../cards/EdgeCard'
import { styled } from '../hoc/styled'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  title: React.ReactNode
  icon: ImageProp
  totalAmount: string
  settlementTime: string

  // Optional:
  partner?: {
    displayName: string
    icon: ImageProp
  }
  /** Content rendered on the right side of the card in the title row. */
  renderRight?: () => React.ReactNode
  /** Whether the provider button should be disabled */
  disableProviderButton?: boolean

  // Events:
  onPress: () => Promise<void> | void
  onLongPress?: () => Promise<void> | void
  onProviderPress: () => Promise<void> | void
}

export const PaymentOptionCard = (props: Props): React.JSX.Element => {
  return (
    <EdgeCard onPress={props.onPress} onLongPress={props.onLongPress}>
      <CardContent>
        <TitleRow>
          <TitleContainer>
            <TitleIcon source={props.icon} />
            <TitleText numberOfLines={1}>{props.title}</TitleText>
          </TitleContainer>
          {props.renderRight?.()}
        </TitleRow>
        <InfoRow>
          <TotalText>{props.totalAmount}</TotalText>
          <SettlementText>{props.settlementTime}</SettlementText>
        </InfoRow>
        {props.partner == null ? null : (
          <PoweredByRow>
            <PoweredByText>{lstrings.plugin_powered_by_space}</PoweredByText>
            <PillButton
              icon={() =>
                props.partner?.icon == null ? null : (
                  <ProviderIcon
                    source={props.partner.icon}
                    resizeMode="contain"
                  />
                )
              }
              label={props.partner?.displayName ?? ''}
              onPress={props.onProviderPress}
              disabled={props.disableProviderButton}
            />
          </PoweredByRow>
        )}
      </CardContent>
    </EdgeCard>
  )
}

// Styled Components

const CardContent = styled(View)(theme => ({
  flex: 1,
  padding: theme.rem(0.5)
}))

const TitleRow = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'center',
  margin: theme.rem(0.5),
  justifyContent: 'space-between',
  gap: theme.rem(1)
}))

const TitleContainer = styled(View)(theme => ({
  flexDirection: 'row',
  gap: theme.rem(1),
  alignItems: 'center',
  flexShrink: 1,
  overflow: 'hidden'
}))

const TitleIcon = styled(Image)(theme => ({
  width: theme.rem(2),
  height: theme.rem(2),
  aspectRatio: 1,
  resizeMode: 'contain'
}))

const TitleText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1),
  fontWeight: '500',
  color: theme.primaryText,
  flexShrink: 1
}))

const InfoRow = styled(View)(theme => ({
  margin: theme.rem(0.5)
}))

const TotalText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.875),
  color: theme.positiveText
}))

const SettlementText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.875),
  color: theme.secondaryText
}))

const PoweredByRow = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingTop: theme.rem(0.5)
}))

const PoweredByText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.875),
  color: theme.primaryText,
  margin: theme.rem(0.5)
}))

const ProviderIcon = styled(FastImage)(theme => ({
  aspectRatio: 1,
  width: theme.rem(1),
  height: theme.rem(1)
}))
