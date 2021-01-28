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

  render() {
    const { isClearable, marginRem = 0.5, theme, ...rest } = this.props
    const spacings = spacingStyles(marginRem, theme)
    const styles = getStyles(theme)
    return (
      <View style={styles.outlinedTextFieldContainer}>
        <OutlinedTextField
          containerStyle={[spacings, styles.outlinedTextField]}
          baseColor={theme.secondaryText}
          errorColor={theme.dangerText}
          textColor={theme.primaryText}
          tintColor={theme.textLink}
          ref={this.props.fieldRef}
          {...rest}
        />
        {isClearable && (
          <TouchableOpacity onPress={this.clearText} style={styles.outlinedTextFieldClearContainer}>
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
    height: theme.rem(4.5)
  },
  outlinedTextField: {
    flex: 1
  },
  outlinedTextFieldClearContainer: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: theme.rem(0.75),
    justifyContent: 'center',
    paddingBottom: theme.rem(0.25) // This is needed because the OutlinedTextField also has innate padding/margin/height on the bottom
  }
}))
export const EdgeTextField = withTheme(EdgeTextFieldComponent)
const EdgeTextFieldOutlinedInner = withTheme(EdgeTextFieldOutlinedComponent)
// $FlowFixMe = forwardRef is not recognize by flow?
export const EdgeTextFieldOutlined = React.forwardRef((props, ref) => <EdgeTextFieldOutlinedInner {...props} fieldRef={ref} />) // eslint-disable-line
