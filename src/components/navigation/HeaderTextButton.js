// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../locales/strings.js'
import { showHelpModal } from '../modals/HelpModal.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  type: 'exit' | 'help'
}

const title = {
  exit: s.strings.string_exit,
  help: s.strings.string_help
}

class HeaderTextButtonComponent extends React.PureComponent<Props & ThemeProps> {
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
      <TouchableOpacity style={styles.container} onPress={this.handlePress}>
        <EdgeText>{title[this.props.type]}</EdgeText>
      </TouchableOpacity>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: theme.rem(1),
    paddingRight: theme.rem(2.5),
    height: 44 // This is a fixed height of the navigation header no matter what screen size. Default by router-flux
  }
}))

export const HeaderTextButton = withTheme(HeaderTextButtonComponent)
