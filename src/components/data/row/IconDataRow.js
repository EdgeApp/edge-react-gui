// @flow

import * as React from 'react'
import { View } from 'react-native'

import { memo } from '../../../types/reactHooks.js'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { EdgeText } from '../../themed/EdgeText.js'

type Props = {|
  icon: React.Node,
  leftText: string,
  leftTextExtended?: string | React.Node,
  leftSubtext: string,
  rightText?: string | React.Node,
  rightSubText?: string | React.Node,
  marginRem?: number[] | number
|}

// -----------------------------------------------------------------------------
// A view representing fields of data accompanied by a left-justified icon
// -----------------------------------------------------------------------------
const IconDataRowComponent = (props: Props) => {
  const { icon, leftText, leftSubtext, leftTextExtended, rightText, rightSubText, marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))

  return (
    <View style={[styles.container, margin]}>
      {icon}
      <View style={styles.nameColumn}>
        <View style={styles.currencyRow}>
          <EdgeText style={styles.currencyText}>{leftText}</EdgeText>
          {leftTextExtended != null ? <EdgeText style={styles.exchangeRateText}>{leftTextExtended}</EdgeText> : null}
        </View>
        <EdgeText style={styles.nameText}>{leftSubtext}</EdgeText>
      </View>
      <View style={styles.balanceColumn}>
        {rightText != null ? <EdgeText>{rightText}</EdgeText> : null}
        {rightSubText != null ? <EdgeText style={styles.fiatBalanceText}>{rightSubText}</EdgeText> : null}
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  balanceColumn: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    paddingRight: theme.rem(1)
  },
  nameColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5),
    marginLeft: theme.rem(1)
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: theme.rem(0.5)
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  // Text:
  fiatBalanceText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  currencyText: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  exchangeRateText: {
    textAlign: 'left',
    flexBasis: 'auto',
    flexShrink: 1,
    marginLeft: theme.rem(0.75)
  },
  nameText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const IconDataRow = memo(IconDataRowComponent)
