// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
// $FlowFixMe = OutlinedTextField is not recognize by flow
import { type TextFieldProps, OutlinedTextField, TextField } from 'react-native-material-textfield'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { unpackEdges } from '../../util/edges.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type EdgeTextFieldProps = {
  marginRem?: number | number[]
}

type EdgeOutlinedTextFieldProps = {
  fieldRef?: ?React.ElementRef<typeof OutlinedTextField>,
  marginRem?: number | number[],
  isClearable: boolean,
  small?: boolean,
  onClear: () => void
}

class EdgeTextFieldComponent extends React.PureComponent<EdgeTextFieldProps & ThemeProps & TextFieldProps> {
  render() {
    const { theme, marginRem = 0.5, ...rest } = this.props
    const margin = unpackEdges(marginRem)
    return (
      <TextField
        containerStyle={{
          marginBottom: theme.rem(margin.bottom),
          marginLeft: theme.rem(margin.left),
          marginRight: theme.rem(margin.right),
          marginTop: theme.rem(margin.top)
        }}
        baseColor={theme.primaryText}
        errorColor={theme.dangerText}
        textColor={theme.primaryText}
        tintColor={theme.primaryText}
        {...rest}
      />
    )
  }
}

class EdgeTextFieldOutlinedComponent extends React.PureComponent<EdgeOutlinedTextFieldProps & ThemeProps & TextFieldProps> {
  clearText = () => {
    const { fieldRef, onClear } = this.props
    if (fieldRef && fieldRef.current) {
      fieldRef.current.clear()
      onClear()
    }
  }

  showSearchIcon = () => {
    const { fieldRef, value } = this.props
    if (fieldRef && fieldRef.current) {
      if (fieldRef.current.focused) return false
    }
    return !value
  }

  render() {
    const { isClearable, marginRem = 0.5, small, theme, ...rest } = this.props
    const spacings = spacingStyles(marginRem, theme)
    const styles = getStyles(theme)
    const searchContentInset = this.showSearchIcon() ? { left: theme.rem(2.25) } : null
    const contentInset = small ? { input: theme.rem(0.75), label: 0, ...searchContentInset } : searchContentInset

    return (
      <View style={styles.outlinedTextFieldContainer}>
        {this.showSearchIcon() ? (
          <View style={[styles.search, { marginLeft: spacings.marginLeft }]}>
            <AntDesignIcon name="search1" color={theme.iconDeactivated} size={theme.rem(1)} />
          </View>
        ) : null}
        <OutlinedTextField
          containerStyle={[spacings, styles.outlinedTextField]}
          contentInset={contentInset}
          baseColor={theme.secondaryText}
          errorColor={theme.dangerText}
          textColor={theme.primaryText}
          tintColor={theme.textLink}
          ref={this.props.fieldRef}
          {...rest}
        />
        {isClearable && (
          <TouchableOpacity onPress={this.clearText} style={[styles.outlinedTextFieldClearContainer, { marginRight: spacings.marginRight }]}>
            <AntDesignIcon name="close" color={theme.icon} size={theme.rem(1)} />
          </TouchableOpacity>
        )}
      </View>
    )
  }
}

function spacingStyles(margin: number | number[], theme: Theme) {
  const marginRem = unpackEdges(margin)

  return {
    marginBottom: theme.rem(marginRem.bottom),
    marginLeft: theme.rem(marginRem.left),
    marginRight: theme.rem(marginRem.right),
    marginTop: theme.rem(marginRem.top)
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  outlinedTextFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.rem(4.5),
    position: 'relative'
  },
  outlinedTextField: {
    flex: 1
  },
  outlinedTextInput: {
    paddingLeft: theme.rem(2)
  },
  outlinedTextFieldClearContainer: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: theme.rem(0.75),
    justifyContent: 'center',
    paddingBottom: theme.rem(0.25) // This is needed because the OutlinedTextField also has innate padding/margin/height on the bottom
  },
  search: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: theme.rem(0.75),
    paddingBottom: theme.rem(0.5)
  }
}))
export const EdgeTextField = withTheme(EdgeTextFieldComponent)
const EdgeTextFieldOutlinedInner = withTheme(EdgeTextFieldOutlinedComponent)
// $FlowFixMe = forwardRef is not recognize by flow?
export const EdgeTextFieldOutlined = React.forwardRef((props, ref) => <EdgeTextFieldOutlinedInner {...props} fieldRef={ref} />) // eslint-disable-line
