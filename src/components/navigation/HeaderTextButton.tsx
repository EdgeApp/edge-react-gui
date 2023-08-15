import { useNavigation } from '@react-navigation/native'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { NavigationBase } from '../../types/routerTypes'
import { triggerHaptic } from '../../util/haptic'
import { showHelpModal } from '../modals/HelpModal'
import { showError } from '../services/AirshipInstance'
import { EdgeText } from '../themed/EdgeText'
import { NavigationButton } from './NavigationButton'

interface Props {
  type: 'exit' | 'help'
}

const title = {
  exit: lstrings.string_exit,
  help: lstrings.string_help
}

export const HeaderTextButton = (props: Props) => {
  const { type } = props
  const navigation = useNavigation<NavigationBase>()

  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    if (type === 'exit') {
      navigation.goBack()
    } else if (type === 'help') {
      showHelpModal(navigation).catch(err => showError(err))
    }
  })

  return (
    <NavigationButton paddingRem={[0, 1]} onPress={handlePress}>
      <EdgeText>{title[type]}</EdgeText>
    </NavigationButton>
  )
}
