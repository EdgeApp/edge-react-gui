import * as React from 'react'
import { Image, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import type { ImageProp } from '../../types/Theme'
import { PillButton } from '../buttons/PillButton'
import { EdgeCard } from '../cards/EdgeCard'
import { BestRateBadge } from '../icons/BestRateBadge'
import { cacheStyles, useTheme } from '../services/ThemeContext'
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
  /** Show "Best Rate" badge */
  isBestOption?: boolean

  // Events:
  onPress: () => Promise<void> | void
  onLongPress?: () => Promise<void> | void
  onProviderPress: () => Promise<void> | void
}

export const PaymentOptionCard: React.FC<Props> = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <EdgeCard
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      paddingRem={0.5}
    >
      <View style={styles.titleRow}>
        <View style={styles.logoTitleView}>
          <Image style={styles.logoIcon} source={props.icon} />
          <EdgeText style={styles.titleText} numberOfLines={1}>
            {props.title}
          </EdgeText>
        </View>
        {props.isBestOption === true ? <BestRateBadge /> : null}
      </View>
      <View style={styles.subtitleView}>
        <EdgeText style={styles.totalAmountText}>{props.totalAmount}</EdgeText>
        <EdgeText style={styles.settlementTimeText}>
          {props.settlementTime}
        </EdgeText>
      </View>
      {props.partner == null ? null : (
        <View style={styles.poweredByRow}>
          <EdgeText style={styles.poweredByText}>
            {lstrings.trade_option_powered_by_label}
          </EdgeText>
          <PillButton
            icon={() =>
              props.partner?.icon == null ? null : (
                <FastImage
                  style={styles.providerIcon}
                  source={props.partner.icon}
                  resizeMode="contain"
                />
              )
            }
            label={props.partner?.displayName ?? ''}
            onPress={props.onProviderPress}
            chevron
          />
        </View>
      )}
    </EdgeCard>
  )
}

// Styles via cacheStyles
const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.rem(0.5),
    justifyContent: 'space-between',
    gap: theme.rem(1)
  },
  logoTitleView: {
    flexDirection: 'row',
    gap: theme.rem(1),
    alignItems: 'center',
    flexShrink: 1,
    overflow: 'hidden'
  },
  logoIcon: {
    width: theme.rem(2),
    height: theme.rem(2),
    aspectRatio: 1,
    resizeMode: 'contain' as const
  },
  titleText: {
    fontSize: theme.rem(1),
    fontWeight: '500' as const,
    color: theme.primaryText,
    flexShrink: 1
  },
  subtitleView: {
    margin: theme.rem(0.5)
  },
  totalAmountText: {
    fontSize: theme.rem(0.875),
    color: theme.positiveText
  },
  settlementTimeText: {
    fontSize: theme.rem(0.875),
    color: theme.secondaryText
  },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  poweredByText: {
    fontSize: theme.rem(0.875),
    color: theme.primaryText,
    margin: theme.rem(0.5)
  },
  providerIcon: {
    aspectRatio: 1,
    width: theme.rem(1),
    height: theme.rem(1)
  }
}))
