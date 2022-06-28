// @flow

import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { toPercentString } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { memo, useMemo } from '../../types/reactHooks'
import { Card } from '../cards/Card'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type Props = {
  apr: number
}

const AprCardComponent = (props: Props) => {
  const { apr } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const aprValue = apr == null || apr === 0 ? '-- ' : toPercentString(apr)
  const displayApr = useMemo(() => sprintf(s.strings.loan_s_apr, aprValue), [aprValue])

  return (
    <View style={styles.cardContainer}>
      <Card paddingRem={[0.5, 1]}>
        <EdgeText>{displayApr}</EdgeText>
      </Card>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'column',
    margin: theme.rem(0.5)
  }
}))

export const AprCard = memo(AprCardComponent)
