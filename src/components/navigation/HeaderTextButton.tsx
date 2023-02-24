import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { triggerHaptic } from '../../util/haptic'
import { showHelpModal } from '../modals/HelpModal'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  type: 'exit' | 'help'
  placement: 'left' | 'right'
}

const title = {
  exit: s.strings.string_exit,
  help: s.strings.string_help
}

export const HeaderTextButton = (props: Props) => {
  const { placement, type } = props
  const navigation = useNavigation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    if (type === 'exit') {
      navigation.goBack()
    } else if (type === 'help') {
      showHelpModal()
    }
  })

  return (
    <TouchableOpacity style={[styles.container, placement === 'left' ? styles.left : styles.right]} onPress={handlePress}>
      <EdgeText>{title[type]}</EdgeText>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 44 // This is a fixed height of the navigation header no matter what screen size. Default by router-flux
  },
  left: {
    paddingLeft: theme.rem(1),
    paddingRight: theme.rem(2.5),
    paddingBottom: theme.rem(0.25)
  },
  right: {
    paddingLeft: theme.rem(2.5),
    paddingRight: theme.rem(1),
    paddingBottom: theme.rem(0.25)
  }
}))
