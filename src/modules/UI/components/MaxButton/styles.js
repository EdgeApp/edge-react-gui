// @flow
import { THEME } from '../../../../theme/variables/airbitz.js'

// Can't access sub-properties if using Stylesheet.create({})
const styles = {
  over: {
    color: THEME.COLORS.GENERIC_RED
  },
  max: {
    color: THEME.COLORS.GENERIC_ORANGE
  },
  under: {
    color: THEME.COLORS.GENERIC_GREEN
  },
  button: {
    flex: 1
  },
  undefined: {
    color: THEME.COLORS.GENERIC_PURPLE
  }
}

export default styles
