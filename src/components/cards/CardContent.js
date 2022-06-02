// @flow

import * as React from 'react'
import { View } from 'react-native'

import { fixSides, mapSides, sidesToPadding } from '../../util/sides.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { DataRow } from '../themed/DataRow'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  image?: React.Node,
  title: string | React.Node,
  subTitle: string,
  value: string | React.Node,
  subValue: string,
  paddingRem?: number[] | number
}

export class CardContentComponent extends React.PureComponent<Props & ThemeProps> {
  renderTitle() {
    const { title, theme } = this.props
    const styles = getStyles(theme)
    if (typeof title === 'string') return <EdgeText style={styles.contentTitle}>{title}</EdgeText>

    return title
  }

  renderValue() {
    const { value, theme } = this.props
    const styles = getStyles(theme)

    if (typeof value === 'string') return <EdgeText style={styles.contentValue}>{value}</EdgeText>

    return value
  }

  render() {
    const { image, subTitle, subValue, paddingRem, theme } = this.props
    const styles = getStyles(theme)
    const padding = sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))

    return (
      <View style={[styles.container, padding]}>
        {image ? <View style={styles.iconContainer}>{image}</View> : null}
        <View style={styles.contentContainer}>
          <DataRow label={this.renderTitle()} value={this.renderValue()} />
          <DataRow
            label={<EdgeText style={styles.contentSubTitle}>{subTitle}</EdgeText>}
            value={<EdgeText style={styles.contentSubValue}>{subValue}</EdgeText>}
          />
        </View>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  contentTitle: {
    fontFamily: theme.fontFaceMedium,
    fontWeight: '600'
  },
  contentValue: {
    fontWeight: '600',
    textAlign: 'right'
  },
  contentSubTitle: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  contentSubValue: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const CardContent = withTheme(CardContentComponent)
