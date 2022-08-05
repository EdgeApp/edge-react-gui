// @flow

import { eq, mul, toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'

import { memo } from '../../types/reactHooks'
import { Card } from '../cards/Card'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile.js'

type Props = {
  title: string,
  currentValue: string,
  futureValue: string
}

const PercentageChangeArrowTileComponent = (props: Props) => {
  const { title, currentValue, futureValue } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const futureValuecolor = eq(currentValue, futureValue) ? theme.primaryText : theme.positiveText

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
          <EdgeText>{currentValueString}</EdgeText>
          {renderArrow()}
          <EdgeText style={{ color: futureValuecolor }}>{futureValueString}</EdgeText>
        </View>
      </Card>
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonArrow = {
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

export const PercentageChangeArrowTile = memo(PercentageChangeArrowTileComponent)
