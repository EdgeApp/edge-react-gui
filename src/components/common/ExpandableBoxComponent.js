// @flow

import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import * as Constants from '../../constants/indexConstants.js'
import { TextAndIconButton, TextAndIconButtonStyle } from '../../modules/UI/components/Buttons/TextAndIconButton.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'

type Props = {
  children: any,
  showMessage: string,
  hideMessage: string
}

type State = {
  collapsed: boolean
}

export class ExpandableBoxComponent extends React.Component<Props, State> {
  constructor(props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)

    this.state = { collapsed: true }
  }

  onPress = () => {
    this.setState({
      collapsed: !this.state.collapsed
    })
  }

  renderTop = () => {
    const msg = this.state.collapsed ? this.props.showMessage : this.props.hideMessage
    const icon = this.state.collapsed ? Constants.KEYBOARD_ARROW_DOWN : Constants.KEYBOARD_ARROW_UP
    return (
      <View style={styles.top}>
        <TextAndIconButton style={textIconButtonStyles} icon={icon} iconType={Constants.MATERIAL_ICONS} onPress={this.onPress} title={msg} />
      </View>
    )
  }

  renderBottom = () => {
    if (!this.state.collapsed) {
      return (
        <View style={styles.bottom}>
          <View style={styles.bottomInfo}>
            <View style={styles.bottomInner}>{this.props.children}</View>
          </View>
        </View>
      )
    }
    return null
  }

  render() {
    return (
      <View
        style={[
          styles.container,
          !this.state.collapsed && {
            borderWidth: 0,
            borderColor: THEME.COLORS.GRAY_3
          }
        ]}
      >
        {this.renderTop()}
        {this.renderBottom()}
      </View>
    )
  }
}

const textIconButtonStyles = {
  ...TextAndIconButtonStyle,
  text: {
    ...TextAndIconButtonStyle.text,
    fontSize: 14,
    color: THEME.COLORS.SECONDARY
  },
  textPressed: {
    ...TextAndIconButtonStyle.text,
    fontSize: 14,
    color: THEME.COLORS.SECONDARY
  },
  icon: {
    ...TextAndIconButtonStyle.icon,
    color: THEME.COLORS.SECONDARY
  }
}

const rawStyles = {
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  top: {
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: THEME.COLORS.GRAY_3,
    height: THEME.BUTTONS.HEIGHT
  },
  bottom: {
    width: '100%',
    flexDirection: 'column'
  },
  bottomInfo: {
    width: '100%',
    minHeight: 40,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 5,
    borderColor: THEME.COLORS.GRAY_3
  },
  bottomInner: {
    width: '100%',
    flexDirection: 'column',
    padding: 5
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
