// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'

type Props = {
  isDisable: boolean
}

export default function PanelLogo(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return props.isDisable ? <View style={styles.disable} /> : null
}

const getStyles = cacheStyles((theme: Theme) => ({
  disable: {
    backgroundColor: '#87939E',
    opacity: 0.8,
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
}))
