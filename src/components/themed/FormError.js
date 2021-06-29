// @flow

import * as React from 'react'
import { View } from 'react-native'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import { unpackEdges } from '../../util/edges'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

type OwnProps = {
  isVisible: boolean,
  children: React.Node,
  marginRem?: number | number[],
  isWarning?: boolean
}

const FormErrorComponent = ({ children, theme, marginRem = 0, isWarning, isVisible, ...props }: OwnProps & ThemeProps) => {
  const styles = getStyles(theme)
  const margin = unpackEdges(marginRem)

  if (!isVisible) return null

  return (
    <View style={[
      styles.container,
      isWarning && styles.warningContainer,
      {
        marginBottom: theme.rem(margin.bottom),
        marginLeft: theme.rem(margin.left),
        marginRight: theme.rem(margin.right),
        marginTop: theme.rem(margin.top)
      }
    ]}>
      <SimpleLineIcons name="info" size={theme.rem(1.1)} color={isWarning ? theme.warningText : theme.dangerText} />
      <EdgeText style={[styles.text, isWarning && styles.warningText]} {...props}>
        {children}
      </EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    borderWidth: 0.25,
    borderRadius: theme.rem(0.25),
    borderColor: theme.dangerText,
    padding: theme.rem(1),
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  text: {
    flexShrink: 1,
    color: theme.dangerText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    marginLeft: theme.rem(0.75)
  },
  warningContainer: {
    borderColor: theme.warningText
  },
  warningText: {
    color: theme.warningText
  }
}))

export const FormError = withTheme(FormErrorComponent)
