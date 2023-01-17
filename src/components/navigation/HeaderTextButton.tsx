import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import s from '../../locales/strings'
import { Actions } from '../../types/routerTypes'
import { triggerHaptic } from '../../util/haptic'
import { showHelpModal } from '../modals/HelpModal'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  type: 'exit' | 'help'
  placement: 'left' | 'right'
}

const title = {
  exit: s.strings.string_exit,
  help: s.strings.string_help
}

class HeaderTextButtonComponent extends React.PureComponent<Props & ThemeProps> {
  handlePress = () => {
    triggerHaptic('impactLight')
    const { type } = this.props
    if (type === 'exit') {
      Actions.pop()
    } else if (type === 'help') {
      showHelpModal()
    }
  }

  render() {
    const styles = getStyles(this.props.theme)
    return (
      <TouchableOpacity style={[styles.container, this.props.placement === 'left' ? styles.left : styles.right]} onPress={this.handlePress}>
        <EdgeText>{title[this.props.type]}</EdgeText>
      </TouchableOpacity>
    )
  }
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

export const HeaderTextButton = withTheme(HeaderTextButtonComponent)
