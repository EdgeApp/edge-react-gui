// @flow
import { hook } from 'cavy'
import * as React from 'react'

import s from '../../locales/strings.js'
import { TouchableOpacity } from '../../types/reactNative.js'
import { Actions } from '../../types/routerTypes.js'
import { showHelpModal } from '../modals/HelpModal.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  type: 'exit' | 'help',
  placement: 'left' | 'right'
}

type TestProps = {
  generateTestHook: (id: string, ref: any) => void,
  testId?: string
}
const title = {
  exit: s.strings.string_exit,
  help: s.strings.string_help
}

class HeaderTextButtonComponent extends React.PureComponent<Props & ThemeProps & TestProps> {
  handlePress = () => {
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
      <TouchableOpacity
        style={[styles.container, this.props.placement === 'left' ? styles.left : styles.right]}
        onPress={this.handlePress}
        ref={this.props.generateTestHook(this.props.testId ?? '')}
      >
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

export const HeaderTextButton = hook(withTheme(HeaderTextButtonComponent))
