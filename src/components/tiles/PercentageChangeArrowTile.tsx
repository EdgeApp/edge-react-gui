import { mul, toFixed } from 'biggystring'
import * as React from 'react'
import { View, ViewStyle } from 'react-native'

import { Card } from '../cards/Card'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

interface Props {
  title: string
  currentValue: string
  currentValueColor?: string
  futureValue: string
  futureValueColor?: string
}

const PercentageChangeArrowTileComponent = (props: Props) => {
  const theme = useTheme()
  const { title, currentValue, currentValueColor = theme.primaryText, futureValue, futureValueColor = theme.primaryText } = props
  const styles = getStyles(theme)

  const currentValueString = `${toFixed(mul(currentValue, '100'), 1, 1)}%`
  const futureValueString = `${toFixed(mul(futureValue, '100'), 1, 1)}%`

  const renderArrow = () => {
    return (
      <View style={styles.arrowContainer}>
        <View style={styles.arrowTopLine} />
        <View style={styles.arrowBase} />
        <View style={styles.arrowBottomLine} />
      </View>
    )
  }

  return (
    <Tile type="static" title={title}>
      <Card marginRem={[0.5, 1, 0, 1]} paddingRem={[0.5, 1, 0.5, 1]}>
        <View style={styles.container}>
          <EdgeText style={{ color: currentValueColor }}>{currentValueString}</EdgeText>
          {renderArrow()}
          <EdgeText style={{ color: futureValueColor }}>{futureValueString}</EdgeText>
        </View>
      </Card>
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonArrow: ViewStyle = {
    position: 'absolute',
    width: theme.thinLineWidth * 2,
    height: theme.rem(0.625),
    right: 0 + theme.thinLineWidth * 1.5,
    borderRadius: theme.thinLineWidth,
    backgroundColor: theme.icon
  }
  return {
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    arrowContainer: {
      flexDirection: 'row'
    },
    arrowBase: {
      width: theme.rem(3),
      height: theme.thinLineWidth * 2,
      borderRadius: theme.thinLineWidth,
      backgroundColor: theme.icon
    },
    arrowTopLine: {
      ...commonArrow,
      bottom: 0 - theme.thinLineWidth * 1.325,
      transform: [{ rotateZ: '-45deg' }]
    },
    arrowBottomLine: {
      ...commonArrow,
      top: 0 - theme.thinLineWidth * 1.325,
      transform: [{ rotateZ: '45deg' }]
    }
  }
})

export const PercentageChangeArrowTile = React.memo(PercentageChangeArrowTileComponent)
