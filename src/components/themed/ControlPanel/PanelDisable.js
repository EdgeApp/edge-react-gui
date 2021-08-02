// @flow

import * as React from 'react'

import { Fade } from '../../../components/animation/Fade'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'

type Props = {
  isVisable: boolean
}

export default function PanelDisable({ isVisable }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return <Fade style={styles.disable} visible={isVisable} fideInOpacity={0.8} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  disable: {
    backgroundColor: '#87939E',
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: theme.rem(2),
    borderBottomLeftRadius: theme.rem(2)
  }
}))
