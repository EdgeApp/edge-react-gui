// @flow

import * as React from 'react'

import Fide from '../../../components/animation/Fide'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'

type Props = {
  isDisable: boolean
}

export default function PanelDisable({ isDisable }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  // const FideComponent = useFide({ fideIn: 0.8 })

  return <Fide style={styles.disable} isFideIn={isDisable} />
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
