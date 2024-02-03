import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { CardUi4 } from '../ui4/CardUi4'

interface Props {
  apr?: number
}

const AprCardComponent = (props: Props) => {
  const { apr } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const aprValue = apr == null || apr === 0 ? '-- ' : toPercentString(apr)
  const displayApr = React.useMemo(() => sprintf(lstrings.loan_s_apr, aprValue), [aprValue])

  return (
    <View style={styles.cardContainer}>
      <CardUi4 paddingRem={[0.5, 1]}>
        <EdgeText>{displayApr}</EdgeText>
      </CardUi4>
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

export const AprCard = React.memo(AprCardComponent)
