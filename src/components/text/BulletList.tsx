import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  points: string[]
  marginRem?: number[] | number
}

/**
 * A bullet-point list of plain strings, drawn in the default (primary) text
 * color. Overflowing points wrap under their own first line rather than under
 * the bullet:
 *
 *  • This is an overflowing
 *    bullet point message
 *  • This one's short
 */
export const BulletList: React.FC<Props> = (props: Props) => {
  const { points, marginRem } = props
  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))

  return (
    <View style={margin}>
      {points.map(point => (
        <View key={point} style={styles.row}>
          <EdgeText>{'• '}</EdgeText>
          <EdgeText style={styles.text} numberOfLines={0}>
            {point}
          </EdgeText>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row'
  },
  text: {
    flexShrink: 1
  }
})
